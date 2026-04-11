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

const SYSTEM = `You are a career roadmap generator. Return ONLY valid JSON. No markdown.`;

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

    const [profileRes, analysisRes] = await Promise.all([
      supabase.from('profiles').select('skills, skill_ratings, education_level, experience_level').eq('id', user.id).single(),
      supabase.from('analyses').select('readiness_score, strengths, weaknesses, missing_skills').eq('profile_id', user.id)
        .order('created_at', { ascending: false }).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const analysis = analysisRes.data;

    const skills = profile?.skills?.slice(0, 6)?.join(', ') || 'None';
    const weak = (analysis?.weaknesses || []).slice(0, 2).map((w: {skill: string}) => w.skill).join(', ') || 'N/A';
    const missing = (analysis?.missing_skills || []).slice(0, 3).map((m: {skill: string}) => m.skill).join(', ') || 'N/A';

    const phases = Math.min(Math.ceil(body.timelinMonths / 2), 3);

    const focusStr = body.focusAreas.join(', ');

    const userPrompt = `Build a personalized ${body.timelinMonths}-month placement prep roadmap.

TARGET: ${body.dreamCompany} — ${body.targetRole}
TIMELINE: ${body.timelinMonths} months, ${body.hoursPerDay} hours per day available
FOCUS AREAS: ${focusStr}
STUDENT PROFILE: ${profile?.experience_level || 'fresher'}, knows ${skills}, readiness ${analysis?.readiness_score || '?'}/100
GAPS: weak in ${weak}, missing ${missing}

RULES:
- Generate exactly ${phases} phases, 2 weeks each
- Daily hour splits must total ${body.hoursPerDay}h (theory+practice+projects)
- Tasks must match the focus areas: ${focusStr}
- Each phase needs 2 resources (1 must be a real youtube playlist URL)
- Company-specific tips must be about ${body.dreamCompany} interview process
- Warnings should be honest about ${body.timelinMonths}-month timeline feasibility

JSON: {"overview":{"feasibility":"realistic|ambitious|unrealistic","feasibilityNote":"str","alternativeCompanies":[],"currentReadiness":0,"targetReadiness":0,"estimatedFinalReadiness":0},"phases":[{"phaseNumber":1,"title":"str","startWeek":1,"endWeek":2,"objective":"str","milestone":"str","resources":[{"title":"str","url":"real url","type":"youtube_playlist|documentation|practice","description":"str"}],"weeks":[{"weekNumber":1,"focus":"str","dailyHoursBreakdown":{"theory":1,"practice":2,"projects":1},"tasks":[{"title":"str","type":"dsa|web_dev|system_design|project|soft_skills","description":"str","resources":["str"],"deliverable":"str"}],"weeklyGoal":"str"}]}],"keySkillsToAcquire":[{"skill":"str","currentLevel":"none|beginner","targetLevel":"intermediate|advanced","estimatedWeeks":4,"priority":"critical|high|medium"}],"interviewPrep":{"dsaProblemsTarget":100,"systemDesignTopics":["str"],"mockInterviewsTarget":5,"companySpecificTips":["str"]},"warnings":["str"]}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roadmap: any = await callGemini({
      systemPrompt: SYSTEM,
      userPrompt,
      jsonMode: true,
      temperature: 0.5,
      maxTokens: 8192,
    });

    // Validate phases exist
    if (!roadmap.phases || !Array.isArray(roadmap.phases) || roadmap.phases.length === 0) {
      console.error('Roadmap generated with empty phases:', JSON.stringify(roadmap).substring(0, 500));
      return NextResponse.json(
        { success: false, error: { code: 'generation_error', message: 'AI generated an incomplete roadmap. Please try again.' } },
        { status: 500 }
      );
    }

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
