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

const SYSTEM = `Career roadmap architect for Indian tech placements. Return ONLY valid JSON.`;

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

    const skills = profile?.skills?.slice(0, 8)?.join(', ') || 'None';
    const weak = (analysis?.weaknesses || []).slice(0, 3).map((w: {skill: string}) => w.skill).join(', ') || 'N/A';
    const missing = (analysis?.missing_skills || []).slice(0, 4).map((m: {skill: string}) => m.skill).join(', ') || 'N/A';

    const phases = Math.min(Math.ceil(body.timelinMonths), 5);

    const userPrompt = `${body.timelinMonths}-month roadmap for ${body.dreamCompany} ${body.targetRole}.
Student: ${profile?.experience_level || 'fresher'}, Skills: ${skills}, Score: ${analysis?.readiness_score || '?'}/100, Weak: ${weak}, Missing: ${missing}
Focus: ${body.focusAreas.join(', ')}, ${body.hoursPerDay}h/day

${phases} phases. Per phase: 3-4 resources (1 must be youtube_playlist with real playlist URL), 2 weeks, 2-3 tasks/week.
Use real URLs from: youtube.com/playlist, leetcode.com, geeksforgeeks.org, react.dev, developer.mozilla.org, neetcode.io

JSON: {"overview":{"feasibility":"realistic|ambitious|unrealistic","feasibilityNote":"str","alternativeCompanies":[],"currentReadiness":0,"targetReadiness":0,"estimatedFinalReadiness":0},"phases":[{"phaseNumber":1,"title":"str","startWeek":1,"endWeek":4,"objective":"str","milestone":"str","resources":[{"title":"str","url":"str","type":"youtube_playlist|youtube|documentation|course|practice","description":"str"}],"weeks":[{"weekNumber":1,"focus":"str","dailyHoursBreakdown":{"theory":1,"practice":2,"projects":0},"tasks":[{"title":"str","type":"dsa|web_dev|system_design|project|soft_skills","description":"str","resources":["str"],"deliverable":"str"}],"weeklyGoal":"str"}]}],"keySkillsToAcquire":[{"skill":"str","currentLevel":"none|beginner|intermediate","targetLevel":"intermediate|advanced","estimatedWeeks":4,"priority":"critical|high|medium"}],"interviewPrep":{"dsaProblemsTarget":150,"systemDesignTopics":["str"],"mockInterviewsTarget":10,"companySpecificTips":["str"]},"warnings":["str"]}`;

    const roadmap = await callGemini({
      systemPrompt: SYSTEM,
      userPrompt,
      jsonMode: true,
      temperature: 0.5,
      maxTokens: 8192,
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
