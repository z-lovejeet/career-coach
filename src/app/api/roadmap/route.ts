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

const SYSTEM = `You are a career roadmap architect for Indian tech placements.
Create a DETAILED, actionable, phase-by-phase roadmap.
Return ONLY valid JSON. Be thorough — students rely on this as their complete study plan.`;

const SCHEMA = `{
  "overview": {
    "feasibility": "realistic|ambitious|unrealistic",
    "feasibilityNote": "2-3 sentence assessment",
    "alternativeCompanies": ["3-5 companies"],
    "currentReadiness": 0-100,
    "targetReadiness": 0-100,
    "estimatedFinalReadiness": 0-100
  },
  "phases": [
    {
      "phaseNumber": 1,
      "title": "descriptive title",
      "startWeek": 1,
      "endWeek": 4,
      "objective": "2-3 sentences explaining this phase's goal",
      "milestone": "specific measurable checkpoint",
      "resources": [
        {"title":"name","url":"real URL","type":"youtube_playlist|youtube|documentation|course|practice","description":"why this resource is useful"}
      ],
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "main focus area",
          "dailyHoursBreakdown": {"theory":1,"practice":2,"projects":0},
          "tasks": [
            {"title":"task name","type":"dsa|web_dev|system_design|project|soft_skills","description":"2-3 sentences on what to do and how","resources":["resource name"],"deliverable":"specific output"}
          ],
          "weeklyGoal": "measurable goal"
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

    // Build context
    const skills = profile?.skills?.slice(0, 12)?.join(', ') || 'None listed';
    const strengths = (analysis?.strengths || []).slice(0, 5).map((s: {skill: string}) => s.skill).join(', ') || 'N/A';
    const weaknesses = (analysis?.weaknesses || []).slice(0, 5).map((w: {skill: string}) => w.skill).join(', ') || 'N/A';
    const missingSkills = (analysis?.missing_skills || []).slice(0, 6).map((m: {skill: string}) => m.skill).join(', ') || 'N/A';

    // More phases for longer, detailed roadmap
    const maxPhases = Math.min(Math.ceil(body.timelinMonths * 1.5), 6);
    const weeksPerPhase = Math.ceil((body.timelinMonths * 4) / maxPhases);

    const userPrompt = `Create a DETAILED ${body.timelinMonths}-month roadmap for ${body.dreamCompany} (${body.targetRole}).

Student Profile:
- Experience: ${profile?.experience_level || 'fresher'}
- Current Skills: ${skills}
- Readiness Score: ${analysis?.readiness_score || '?'}/100
- Strengths: ${strengths}
- Weaknesses: ${weaknesses}
- Missing Skills: ${missingSkills}
- Focus Areas: ${body.focusAreas.join(', ')}
- Available Hours/Day: ${body.hoursPerDay}

RULES (FOLLOW STRICTLY):
1. Generate exactly ${maxPhases} phases, ~${weeksPerPhase} weeks each
2. Each phase MUST have 4-6 resources including:
   - At LEAST 1 YouTube PLAYLIST link (use type "youtube_playlist") — full playlists from channels like freeCodeCamp, Traversy Media, Striver, Abdul Bari, Akshay Saini, CodeWithHarry, Apna College, Love Babbar, take U forward, Neetcode, Tech With Tim etc.
   - At least 1 documentation/reference link
   - At least 1 practice platform link (LeetCode, HackerRank, GeeksforGeeks, etc.)
3. Each phase: ${weeksPerPhase} weeks with 3-4 tasks per week
4. Task descriptions should be 2-3 sentences explaining what to do and how
5. Use REAL, working URLs — youtube.com/playlist?list=..., leetcode.com, geeksforgeeks.org, developer.mozilla.org, react.dev, docs.python.org, etc.
6. Top 6 skills to acquire, top 5 warnings
7. Include specific YouTube playlist URLs like:
   - https://youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt (CodeWithHarry)
   - https://youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ (Kunal Kushwaha)
   - https://youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz (take U forward)
   - https://youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA (Love Babbar)

JSON schema: ${SCHEMA}`;

    // Use Gemini 2.5-flash directly for longer output without truncation
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: 'application/json',
        temperature: 0.6,
        maxOutputTokens: 16384,
      },
    });

    const text = result.text || '';
    let roadmap;
    try {
      roadmap = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        roadmap = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse roadmap response');
      }
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
