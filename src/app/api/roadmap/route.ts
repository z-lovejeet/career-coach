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

const SYSTEM = `You are a career roadmap architect for Indian tech placements. Create a concise, actionable roadmap. Return ONLY valid JSON. Keep responses compact.`;

const SCHEMA = `{
  "overview": {
    "feasibility": "realistic|ambitious|unrealistic",
    "feasibilityNote": "1 sentence assessment",
    "alternativeCompanies": [],
    "currentReadiness": 0-100,
    "targetReadiness": 0-100,
    "estimatedFinalReadiness": 0-100
  },
  "phases": [
    {
      "phaseNumber": 1,
      "title": "short title",
      "startWeek": 1,
      "endWeek": 4,
      "objective": "1 sentence",
      "milestone": "checkpoint",
      "resources": [
        {"title":"name","url":"real URL","type":"youtube|documentation|course|practice","description":"why useful"}
      ],
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "main focus",
          "dailyHoursBreakdown": {"theory":1,"practice":2,"projects":0},
          "tasks": [
            {"title":"task","type":"dsa|web_dev|system_design|project|soft_skills","description":"what to do","resources":["resource"],"deliverable":"output"}
          ],
          "weeklyGoal": "goal"
        }
      ]
    }
  ],
  "keySkillsToAcquire": [
    {"skill":"name","currentLevel":"none|beginner|intermediate","targetLevel":"intermediate|advanced","estimatedWeeks":4,"priority":"critical|high|medium"}
  ],
  "interviewPrep": {
    "dsaProblemsTarget": 150,
    "systemDesignTopics": ["topic"],
    "mockInterviewsTarget": 10,
    "companySpecificTips": ["tip"]
  },
  "warnings": ["warning"]
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

    // Fetch profile + analysis in parallel
    const [profileRes, analysisRes] = await Promise.all([
      supabase.from('profiles').select('skills, skill_ratings, education_level, field_of_study, experience_level, projects').eq('id', user.id).single(),
      supabase.from('analyses').select('readiness_score, strengths, weaknesses, missing_skills, summary').eq('profile_id', user.id)
        .order('created_at', { ascending: false }).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const analysis = analysisRes.data;

    // Build compact context
    const skills = profile?.skills?.slice(0, 8)?.join(', ') || 'None listed';
    const strengths = (analysis?.strengths || []).slice(0, 3).map((s: {skill: string}) => s.skill).join(', ') || 'N/A';
    const weaknesses = (analysis?.weaknesses || []).slice(0, 3).map((w: {skill: string}) => w.skill).join(', ') || 'N/A';
    const missingSkills = (analysis?.missing_skills || []).slice(0, 4).map((m: {skill: string}) => m.skill).join(', ') || 'N/A';

    // Limit phases based on timeline to keep response small
    const maxPhases = Math.min(Math.ceil(body.timelinMonths / 2), 4);
    const weeksPerPhase = Math.ceil((body.timelinMonths * 4) / maxPhases);

    const userPrompt = `Create a ${body.timelinMonths}-month roadmap for ${body.dreamCompany} (${body.targetRole}).

Student: ${profile?.experience_level || 'fresher'}, Skills: ${skills}
Readiness: ${analysis?.readiness_score || '?'}/100, Strengths: ${strengths}, Weak: ${weaknesses}, Missing: ${missingSkills}
Focus: ${body.focusAreas.join(', ')}, Hours/day: ${body.hoursPerDay}

RULES:
- Generate exactly ${maxPhases} phases, ~${weeksPerPhase} weeks each
- Each phase: 3-5 resources (real YouTube/doc/practice URLs), 2-3 weeks, 2-3 tasks per week
- Keep descriptions SHORT (1 sentence max)
- Use real URLs: youtube.com, leetcode.com, geeksforgeeks.org, developer.mozilla.org, react.dev, etc.
- Top 4 skills to acquire, top 3 warnings

JSON schema: ${SCHEMA}`;

    const roadmap = await callGemini({
      systemPrompt: SYSTEM,
      userPrompt,
      jsonMode: true,
      temperature: 0.6,
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
