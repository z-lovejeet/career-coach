import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeProfile } from '@/lib/agents/analyzer';
import { generateWeeklyPlan } from '@/lib/agents/planner';
import { callGemini } from '@/lib/agents/gemini';
import type { AnalyzerInput, PlannerInput } from '@/types';

/**
 * AGENTIC BEHAVIOR:
 * 1. Analyzes the student's profile using AI
 * 2. If a resume is uploaded, uses Gemini to extract & analyze resume content
 * 3. AUTO-GENERATES first week's tasks based on detected weaknesses
 *    (The AI DECIDES to assign practice — not the user)
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: { code: 'no_profile', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    // === RESUME ANALYSIS ===
    // If the user uploaded a resume, use Gemini to extract key info from it
    let resumeAnalysis = '';
    if (profile.resume_url) {
      try {
        console.log('Fetching resume for AI analysis:', profile.resume_url);
        const pdfRes = await fetch(profile.resume_url);
        if (pdfRes.ok) {
          const pdfBuffer = await pdfRes.arrayBuffer();
          const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
          
          // Use Gemini to read the PDF directly (no pdf-parse needed!)
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
          
          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64Pdf,
                    },
                  },
                  {
                    text: `Extract the following from this resume in a structured text format:
1. Name and contact info
2. Education details
3. All technical skills mentioned
4. Work experience / internships
5. Projects with tech stacks used
6. Certifications
7. Key achievements

Return a clean, structured text summary. No JSON needed.`,
                  },
                ],
              },
            ],
          });

          resumeAnalysis = result.text || '';
          console.log('Resume analyzed successfully, extracted', resumeAnalysis.length, 'chars');
        }
      } catch (resumeErr) {
        console.warn('Resume analysis skipped:', resumeErr);
      }
    }

    // Build analyzer input with resume content
    const input: AnalyzerInput = {
      skills: profile.skills || [],
      skill_ratings: profile.skill_ratings || {},
      projects: profile.projects || [],
      education: `${profile.education_level || ''} ${profile.field_of_study || ''}`.trim(),
      experience: profile.experience_level || 'fresher',
      goals: profile.goals || [],
      resume_text: resumeAnalysis || profile.resume_text || undefined,
    };

    // Run analyzer agent
    const analysis = await analyzeProfile(input);

    // Store analysis in database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        profile_id: user.id,
        extracted_skills: analysis.extracted_skills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missing_skills: analysis.missing_skills,
        readiness_score: analysis.readiness_score,
        summary: analysis.summary,
        raw_response: analysis,
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { success: false, error: { code: 'save_failed', message: saveError.message } },
        { status: 500 }
      );
    }

    // === AGENTIC: AUTO-GENERATE TASKS ===
    // The AI proactively creates a study plan based on detected weaknesses
    try {
      console.log('🤖 Agentic: Auto-generating tasks based on weakness detection...');
      
      const plannerInput: PlannerInput = {
        analysis: {
          extracted_skills: analysis.extracted_skills,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          missing_skills: analysis.missing_skills,
          readiness_score: analysis.readiness_score,
          summary: analysis.summary,
        },
        recommendations: {
          current_fit_companies: [],
          target_companies: [],
          skill_gaps: analysis.missing_skills.map((s: { skill: string; importance: string }) => ({
            skill: s.skill,
            gap_level: s.importance === 'critical' ? 'major' : 'minor',
            recommended_action: `Practice and study ${s.skill}`,
          })),
          roadmap_to_target: [],
        },
        goals: profile.goals || [],
        available_hours_per_day: 3,
        current_week: 1,
      };

      const plan = await generateWeeklyPlan(plannerInput);

      // Save auto-generated tasks
      const tasksToInsert = plan.weekly_plan.tasks.map(task => ({
        profile_id: user.id,
        analysis_id: savedAnalysis.id,
        title: task.title,
        description: task.description,
        category: task.category,
        difficulty: task.difficulty,
        type: task.type,
        day_number: task.day_number,
        week_number: 1,
        priority: task.priority,
        completed: false,
      }));

      await supabase.from('tasks').insert(tasksToInsert);
      console.log(`🤖 Agentic: Auto-assigned ${tasksToInsert.length} tasks based on weakness detection`);
    } catch (planErr) {
      // Task generation is best-effort — don't fail the whole analysis if it errors
      console.warn('Auto-task generation skipped:', planErr);
    }

    return NextResponse.json({ success: true, data: savedAnalysis });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'AI analysis failed. Please try again.' } },
      { status: 500 }
    );
  }
}
