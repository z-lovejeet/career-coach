import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/agents/gemini';

interface RoadmapInput {
  dreamCompany: string;
  targetRole: string;
  timelinMonths: number;
  hoursPerDay: number;
  focusAreas: string[];
}

const ROADMAP_SYSTEM_PROMPT = `You are an expert Career Roadmap Architect specializing in the Indian tech industry.

Your job is to create a REALISTIC, ACTIONABLE, WEEK-BY-WEEK career preparation roadmap WITH CURATED STUDY RESOURCES.

CRITICAL RULES:
- Be BRUTALLY HONEST about timelines. Don't sugarcoat.
- Match difficulty to the student's ACTUAL current skill level.
- If the dream company is unrealistic in the given timeframe, SAY SO and suggest alternatives.
- Consider real hiring bar of the target company (e.g., Google requires strong DSA + System Design, Flipkart needs good problem solving, TCS is easier entry).
- Each week should have CONCRETE deliverables — not vague "study X".
- Factor in the student's existing skills to SKIP what they already know.
- Progressively increase difficulty.
- Add milestones and checkpoints.

RESOURCE RULES (VERY IMPORTANT):
- Each phase MUST include 4-8 curated study resources.
- Include REAL, WORKING URLs from: YouTube channels (Striver, NeetCode, Apna College, CodeWithHarry, Love Babbar, Take U Forward, freeCodeCamp, Fireship, Traversy Media, The Net Ninja, etc.), documentation (MDN, React docs, Node.js docs), and practice platforms (LeetCode, GeeksforGeeks, HackerRank, Codeforces).
- Each resource must have a type: "youtube", "documentation", "course", "practice", "article", or "tool".
- Prefer LATEST and MOST POPULAR resources. Include specific video/playlist URLs when possible.
- Resources should directly match the phase's learning objectives.

IMPORTANT: Return ONLY valid JSON matching the exact schema below. No markdown, no extra text.`;

const ROADMAP_OUTPUT_SCHEMA = `{
  "overview": {
    "feasibility": "realistic" | "ambitious" | "unrealistic",
    "feasibilityNote": "Honest assessment of whether this goal is achievable in the given time",
    "alternativeCompanies": ["Company1", "Company2"] (only if feasibility is unrealistic),
    "currentReadiness": 0-100,
    "targetReadiness": 0-100,
    "estimatedFinalReadiness": 0-100
  },
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase name",
      "startWeek": 1,
      "endWeek": 4,
      "objective": "What this phase aims to achieve",
      "milestone": "Concrete checkpoint to verify progress",
      "resources": [
        {
          "title": "Resource name (e.g., 'Striver A2Z DSA Sheet')",
          "url": "https://real-url.com",
          "type": "youtube" | "documentation" | "course" | "practice" | "article" | "tool",
          "description": "Why this resource is useful for this phase"
        }
      ],
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "Main focus for this week",
          "dailyHoursBreakdown": {
            "theory": 1,
            "practice": 2,
            "projects": 0
          },
          "tasks": [
            {
              "title": "Specific task",
              "type": "dsa" | "web_dev" | "system_design" | "project" | "soft_skills" | "revision" | "mock_interview",
              "description": "Detailed description of what to do",
              "resources": ["Resource URL or name"],
              "deliverable": "What should be completed by end of this task"
            }
          ],
          "weeklyGoal": "What to achieve by weekend"
        }
      ]
    }
  ],
  "keySkillsToAcquire": [
    {
      "skill": "Skill name",
      "currentLevel": "none" | "beginner" | "intermediate" | "advanced",
      "targetLevel": "beginner" | "intermediate" | "advanced" | "expert",
      "estimatedWeeks": 4,
      "priority": "critical" | "high" | "medium" | "low"
    }
  ],
  "interviewPrep": {
    "dsaProblemsTarget": 150,
    "systemDesignTopics": ["Topic1", "Topic2"],
    "mockInterviewsTarget": 10,
    "companySpecificTips": ["Tip1", "Tip2"]
  },
  "warnings": ["Any honest warnings about gaps or challenges"]
}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body: RoadmapInput = await request.json();

    // Fetch user's profile + latest analysis
    const [profileRes, analysisRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('analyses').select('*').eq('profile_id', user.id)
        .order('created_at', { ascending: false }).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const analysis = analysisRes.data;

    // Fetch completed tasks count
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('completed', true);

    // Build context for Gemini
    const skillsInfo = profile?.skills?.length
      ? profile.skills.map((s: string) => `${s} (${profile.skill_ratings?.[s] || '?'}/10)`).join(', ')
      : 'No skills listed';

    const analysisInfo = analysis
      ? `Readiness Score: ${analysis.readiness_score}/100
Strengths: ${(analysis.strengths || []).map((s: {skill: string}) => s.skill).join(', ')}
Weaknesses: ${(analysis.weaknesses || []).map((w: {skill: string}) => w.skill).join(', ')}
Missing Skills: ${(analysis.missing_skills || []).map((m: {skill: string; importance: string}) => `${m.skill} (${m.importance})`).join(', ')}
Summary: ${analysis.summary || 'N/A'}`
      : 'No AI analysis available yet';

    const userPrompt = `Create a detailed career preparation roadmap based on this student's profile:

STUDENT PROFILE:
- Education: ${profile?.education_level || 'Unknown'} in ${profile?.field_of_study || 'Unknown'}
- Experience Level: ${profile?.experience_level || 'fresher'}
- Current Skills: ${skillsInfo}
- Projects: ${profile?.projects?.length || 0} projects completed
- Tasks Completed: ${completedTasks || 0}
- Resume Text Available: ${profile?.resume_text ? 'Yes' : 'No'}

AI ANALYSIS RESULTS:
${analysisInfo}

ROADMAP REQUIREMENTS:
- Dream Company: ${body.dreamCompany}
- Target Role: ${body.targetRole}
- Timeline: ${body.timelinMonths} months
- Available Hours/Day: ${body.hoursPerDay}
- Focus Areas: ${body.focusAreas.join(', ')}

Generate a week-by-week preparation plan. Be realistic about whether this student can reach their goal in the given time.

Respond with JSON matching this schema:
${ROADMAP_OUTPUT_SCHEMA}`;

    const roadmap = await callGemini({
      systemPrompt: ROADMAP_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.6,
      maxTokens: 16000,
    });

    return NextResponse.json({ success: true, data: roadmap });
  } catch (err) {
    console.error('Roadmap generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate roadmap';
    return NextResponse.json(
      { success: false, error: { code: 'generation_error', message } },
      { status: 500 }
    );
  }
}
