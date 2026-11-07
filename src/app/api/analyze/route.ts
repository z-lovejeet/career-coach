import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { downloadResume } from '@/lib/supabase/resume';
import { readResumeWithGemini } from '@/lib/agents/resume';
import { analyzeProfile } from '@/lib/agents/analyzer';
import { generateWeeklyPlan } from '@/lib/agents/planner';
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

    const quota = await enforceAIQuota(supabase, 'analysis');
    if (quota) return quota;

    let resumeAnalysis = '';
    if (profile.resume_url) {
      try {
        const pdf = await downloadResume(supabase, profile.resume_url, user.id);
        if (pdf) {
          resumeAnalysis = await readResumeWithGemini(pdf, 'Summarize the technical skills, education, work experience, projects, and relevant certifications supported by the attached resume. Omit contact information.');
        }
      } catch {
        console.warn('[Resume] Could not read the attached PDF for profile analysis.');
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
      resume_text: resumeAnalysis || undefined,
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

    // Seed the first practice week once. Later analyses preserve existing practice.
    try {
      const { data: firstWeek, error: tasksError } = await supabase.from('tasks')
        .select('id').eq('profile_id', user.id).eq('week_number', 1).limit(1);
      if (tasksError) throw tasksError;

      if (!firstWeek?.length) {
        const plannerInput: PlannerInput = {
          analysis,
          recommendations: {
            current_fit_companies: [],
            target_companies: [],
            skill_gaps: analysis.missing_skills.map(skill => ({
              skill: skill.skill,
              current_level: 'none',
              required_level: 'intermediate',
              priority: skill.importance,
            })),
            roadmap_to_target: [],
          },
          goals: profile.goals || [],
          available_hours_per_day: 3,
          current_week: 1,
        };
        const plan = await generateWeeklyPlan(plannerInput);
        const { error: saveTasksError } = await supabase.rpc('save_weekly_tasks', {
          p_analysis_id: savedAnalysis.id,
          p_week_number: 1,
          p_tasks: plan.weekly_plan.tasks,
        });
        if (saveTasksError) throw saveTasksError;
      }
    } catch (err) {
      console.warn('Initial practice plan was skipped:', err instanceof Error ? err.name : 'database_error');
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
