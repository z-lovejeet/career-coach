import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { callAI } from '@/lib/agents/ai';

const FOCUS = {
  dsa: { label: 'Data structures and algorithms', type: 'dsa', title: 'LeetCode problem set', url: 'https://leetcode.com/problemset/' },
  web_dev: { label: 'Web development', type: 'web_dev', title: 'MDN learning path', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development' },
  system_design: { label: 'System design', type: 'system_design', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
  projects: { label: 'Projects and portfolio', type: 'project', title: 'GitHub Skills', url: 'https://skills.github.com/' },
  soft_skills: { label: 'Communication and behavioral skills', type: 'soft_skills', title: 'Behavioral interview practice', url: '/interview' },
  mock_interviews: { label: 'Mock interviews', type: 'mock_interview', title: 'Mock interview practice', url: '/interview' },
};

type FocusArea = keyof typeof FOCUS;
type RoadmapSettings = {
  dreamCompany: string;
  targetRole: string;
  timelineMonths: number;
  hoursPerDay: number;
  focusAreas: FocusArea[];
};

type Outline = {
  overview: {
    feasibility: 'realistic' | 'ambitious' | 'unrealistic';
    feasibilityNote: string;
    targetReadiness: number;
    estimatedFinalReadiness: number;
  };
  phases: Array<{
    title: string;
    focusArea: FocusArea;
    objective: string;
    milestone: string;
    weeks: Array<{ focus: string; exercise: string; deliverable: string }>;
  }>;
  keySkillsToAcquire: Array<{
    skill: string;
    currentLevel: string;
    targetLevel: string;
    estimatedWeeks: number;
    priority: string;
  }>;
  interviewPrep: {
    dsaProblemsTarget: number;
    systemDesignTopics: string[];
    mockInterviewsTarget: number;
    companySpecificTips: string[];
  };
  warnings: string[];
};

const DEFAULT_FOCUS: FocusArea[] = ['dsa', 'web_dev'];
const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const hasNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const hasStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(hasText);
const isFocusArea = (value: unknown): value is FocusArea => typeof value === 'string' && Object.hasOwn(FOCUS, value);

function readSettings(body: Record<string, unknown> | null): RoadmapSettings | null {
  const dreamCompany = hasText(body?.dreamCompany) ? body.dreamCompany.trim() : '';
  const targetRole = hasText(body?.targetRole) ? body.targetRole.trim() : 'Software Engineer';
  const timelineMonths = body?.timelineMonths ?? body?.timelinMonths ?? 6;
  const hoursPerDay = body?.hoursPerDay ?? 4;
  const focusAreas = body?.focusAreas ?? DEFAULT_FOCUS;
  if (!dreamCompany || dreamCompany.length > 120 || targetRole.length > 120
    || typeof timelineMonths !== 'number' || !Number.isInteger(timelineMonths) || timelineMonths < 1 || timelineMonths > 12
    || typeof hoursPerDay !== 'number' || !Number.isFinite(hoursPerDay) || hoursPerDay < 1 || hoursPerDay > 12
    || !Array.isArray(focusAreas) || focusAreas.length < 1 || focusAreas.length > 6 || !focusAreas.every(isFocusArea)) {
    return null;
  }
  return { dreamCompany, targetRole, timelineMonths, hoursPerDay, focusAreas: [...new Set(focusAreas)] };
}

function normalizeOutline(raw: any, weeksPerPhase: number[], focusAreas: FocusArea[]): Outline {
  if (!raw || typeof raw !== 'object') return raw;

  const rawFeasibility = String(raw.overview?.feasibility || 'realistic').toLowerCase();
  const feasibility = ['realistic', 'ambitious', 'unrealistic'].includes(rawFeasibility)
    ? (rawFeasibility as 'realistic' | 'ambitious' | 'unrealistic')
    : 'realistic';
  const overview = {
    feasibility,
    feasibilityNote: String(raw.overview?.feasibilityNote || 'A structured plan to achieve your target role.'),
    targetReadiness: Number(raw.overview?.targetReadiness) || 85,
    estimatedFinalReadiness: Number(raw.overview?.estimatedFinalReadiness) || 80,
  };

  const phases = Array.isArray(raw.phases) ? raw.phases : [];
  const normalizedPhases = weeksPerPhase.map((expectedWeeks, index) => {
    const phase = phases[index] || {};
    let focusArea = String(phase.focusArea || '').toLowerCase().replace(/[\s-]+/g, '_') as FocusArea;
    if (!focusAreas.includes(focusArea)) {
      focusArea = focusAreas[index % focusAreas.length];
    }
    const weeks = Array.isArray(phase.weeks) ? phase.weeks : [];
    const normalizedWeeks = Array.from({ length: expectedWeeks }, (_, wIdx) => {
      const w = weeks[wIdx] || {};
      return {
        focus: String(w.focus || `Core concepts practice - Week ${wIdx + 1}`),
        exercise: String(w.exercise || 'Complete assigned problem set and review explanations.'),
        deliverable: String(w.deliverable || 'Verified working implementation and notes.'),
      };
    });

    return {
      title: String(phase.title || `Phase ${index + 1}: ${FOCUS[focusArea]?.label || 'Core Fundamentals'}`),
      focusArea,
      objective: String(phase.objective || `Master key topics in ${FOCUS[focusArea]?.label || 'the curriculum'}.`),
      milestone: String(phase.milestone || `Complete milestones for Month ${index + 1}.`),
      weeks: normalizedWeeks,
    };
  });

  const skills = Array.isArray(raw.keySkillsToAcquire) ? raw.keySkillsToAcquire : [];
  const normalizedSkills = skills.map((item: any) => {
    const rawPriority = String(item?.priority || 'medium').toLowerCase();
    const priority = ['critical', 'high', 'medium', 'low'].includes(rawPriority) ? rawPriority : 'medium';
    return {
      skill: String(item?.skill || 'Technical Competency'),
      currentLevel: String(item?.currentLevel || 'Intermediate'),
      targetLevel: String(item?.targetLevel || 'Advanced'),
      estimatedWeeks: Number(item?.estimatedWeeks) || 4,
      priority,
    };
  });

  const interview = raw.interviewPrep || {};
  const normalizedInterview = {
    dsaProblemsTarget: Number(interview.dsaProblemsTarget) || 40,
    systemDesignTopics: Array.isArray(interview.systemDesignTopics) && interview.systemDesignTopics.length > 0
      ? interview.systemDesignTopics.map(String)
      : ['Caching and CDN', 'Database Sharding', 'Load Balancing', 'Microservices Architecture'],
    mockInterviewsTarget: Number(interview.mockInterviewsTarget) || 4,
    companySpecificTips: Array.isArray(interview.companySpecificTips) && interview.companySpecificTips.length > 0
      ? interview.companySpecificTips.map(String)
      : ['Review company leadership principles and core technical architecture.'],
  };

  const warnings = Array.isArray(raw.warnings) && raw.warnings.length > 0
    ? raw.warnings.map(String)
    : ['Stay consistent with daily dedicated practice hours.'];

  return {
    overview,
    phases: normalizedPhases,
    keySkillsToAcquire: normalizedSkills.length > 0 ? normalizedSkills : [
      { skill: 'Data Structures', currentLevel: 'Intermediate', targetLevel: 'Advanced', estimatedWeeks: 4, priority: 'high' }
    ],
    interviewPrep: normalizedInterview,
    warnings,
  };
}

function validateOutline(outline: Outline, weeksPerPhase: number[], focusAreas: FocusArea[]): boolean {
  const overview = outline?.overview;
  const interview = outline?.interviewPrep;
  return !!overview && ['realistic', 'ambitious', 'unrealistic'].includes(overview.feasibility)
    && hasText(overview.feasibilityNote) && hasNumber(overview.targetReadiness) && hasNumber(overview.estimatedFinalReadiness)
    && Array.isArray(outline.phases) && outline.phases.length === weeksPerPhase.length
    && outline.phases.every((phase, index) => phase && focusAreas.includes(phase.focusArea)
      && hasText(phase.title) && hasText(phase.objective) && hasText(phase.milestone)
      && Array.isArray(phase.weeks) && phase.weeks.length === weeksPerPhase[index]
      && phase.weeks.every(week => week && hasText(week.focus) && hasText(week.exercise) && hasText(week.deliverable)))
    && Array.isArray(outline.keySkillsToAcquire) && outline.keySkillsToAcquire.every(item => item
      && hasText(item.skill) && hasText(item.currentLevel) && hasText(item.targetLevel)
      && hasNumber(item.estimatedWeeks) && ['critical', 'high', 'medium', 'low'].includes(item.priority))
    && !!interview && hasNumber(interview.dsaProblemsTarget) && hasNumber(interview.mockInterviewsTarget)
    && hasStrings(interview.systemDesignTopics) && hasStrings(interview.companySpecificTips)
    && hasStrings(outline.warnings);
}

function listSkills(value: unknown): string {
  if (!Array.isArray(value)) return 'None';
  return value.slice(0, 6).map(entry => {
    if (hasText(entry)) return entry.slice(0, 100);
    return hasText(entry?.skill) ? entry.skill.slice(0, 100) : '';
  }).filter(Boolean).join(', ') || 'None';
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('roadmaps')
      .select('content')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .order('id')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'No saved roadmap found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: data.content });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Could not load your roadmap.' } },
      { status: 500 }
    );
  }
}

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

    const settings = readSettings(await request.json().catch(() => null));
    if (!settings) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_settings', message: 'Choose a company, focus areas, and a timeline of 1–12 months.' } },
        { status: 400 }
      );
    }

    const [profile, analysis] = await Promise.all([
      supabase.from('profiles').select('skills, experience_level').eq('id', user.id).maybeSingle(),
      supabase.from('analyses').select('readiness_score, weaknesses, missing_skills').eq('profile_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (profile.error || analysis.error) throw profile.error || analysis.error;
    const quota = await enforceAIQuota(supabase, 'roadmap');
    if (quota) return quota;

    const { dreamCompany, targetRole, timelineMonths, hoursPerDay, focusAreas } = settings;
    // Allocate the weeks in the selected horizon to contiguous monthly phases.
    const weeksPerPhase = Array.from({ length: timelineMonths }, (_, month) =>
      Math.round((month + 1) * 52 / 12) - Math.round(month * 52 / 12)
    );
    const currentReadiness = analysis.data?.readiness_score ?? 0;
    const rawOutline = await callAI<Outline>({
      systemPrompt: 'You are a placement coach creating a practical study curriculum. Return only valid JSON matching the requested structure.',
      userPrompt: `Target: ${targetRole} at ${dreamCompany}. Time available: ${hoursPerDay} hours per day.
Candidate level: ${profile.data?.experience_level || 'fresher'}. Current readiness: ${currentReadiness}/100.
Skills: ${listSkills(profile.data?.skills)}. Weaknesses: ${listSkills(analysis.data?.weaknesses)}. Gaps: ${listSkills(analysis.data?.missing_skills)}.
Selected focus areas: ${focusAreas.map(area => `${area} (${FOCUS[area].label})`).join(', ')}.

Build exactly ${timelineMonths} phases, each covering a month. In order, the phases must have exactly these counts of week entries: [${weeksPerPhase.join(', ')}].
Choose one of the selected focus IDs as each phase's focusArea. Cover the selected domains over time. Give every week a distinct focus, exercise and verifiable deliverable. Keep each exercise and deliverable under 16 words. Use honest projections and company tips. Do not generate links.
Return this shape:
{"overview":{"feasibility":"realistic|ambitious|unrealistic","feasibilityNote":"text","targetReadiness":80,"estimatedFinalReadiness":70},"phases":[{"title":"text","focusArea":"selected focus ID","objective":"text","milestone":"text","weeks":[{"focus":"text","exercise":"text","deliverable":"text"}]}],"keySkillsToAcquire":[{"skill":"text","currentLevel":"text","targetLevel":"text","estimatedWeeks":4,"priority":"critical|high|medium|low"}],"interviewPrep":{"dsaProblemsTarget":30,"systemDesignTopics":["text"],"mockInterviewsTarget":4,"companySpecificTips":["text"]},"warnings":["text"]}`,
      jsonMode: true,
      temperature: 0.4,
      maxTokens: 12000,
    }, 'gemini');

    const outline = normalizeOutline(rawOutline, weeksPerPhase, focusAreas);

    if (!validateOutline(outline, weeksPerPhase, focusAreas)) {
      return NextResponse.json(
        { success: false, error: { code: 'generation_error', message: 'The plan was incomplete. Please generate it again.' } },
        { status: 502 }
      );
    }

    const theory = Math.round(hoursPerDay * 25) / 100;
    const practice = Math.round(hoursPerDay * 50) / 100;
    const projects = Math.round((hoursPerDay - theory - practice) * 100) / 100;
    let weekNumber = 0;
    const roadmap = {
      settings,
      overview: {
        ...outline.overview,
        currentReadiness,
        targetReadiness: Math.min(100, outline.overview.targetReadiness),
        estimatedFinalReadiness: Math.min(100, outline.overview.estimatedFinalReadiness),
        alternativeCompanies: [],
      },
      phases: outline.phases.map((phase, index) => {
        const resource = FOCUS[phase.focusArea];
        const startWeek = weekNumber + 1;
        const weeks = phase.weeks.map(week => ({
          weekNumber: ++weekNumber,
          focus: week.focus,
          dailyHoursBreakdown: { theory, practice, projects },
          weeklyGoal: week.deliverable,
          tasks: [{
            title: week.focus,
            type: resource.type,
            description: week.exercise,
            deliverable: week.deliverable,
            resources: [],
          }],
        }));
        return {
          phaseNumber: index + 1,
          title: phase.title,
          startWeek,
          endWeek: weekNumber,
          objective: phase.objective,
          milestone: phase.milestone,
          resources: [{
            title: resource.title,
            url: resource.url,
            type: 'practice',
            description: `Practice ${resource.label.toLowerCase()}.`,
          }],
          weeks,
        };
      }),
      keySkillsToAcquire: outline.keySkillsToAcquire,
      interviewPrep: outline.interviewPrep,
      warnings: outline.warnings,
    };

    const { error: saveError } = await supabase.from('roadmaps').insert({
      profile_id: user.id,
      dream_company: dreamCompany,
      target_role: targetRole,
      timeline_months: timelineMonths,
      content: roadmap,
    });
    if (saveError) {
      console.error('Roadmap save failed:', saveError.code);
      return NextResponse.json(
        { success: false, error: { code: 'save_failed', message: 'Could not save your roadmap. Please try again.' } },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: roadmap });
  } catch (err) {
    console.error('Roadmap generation error:', err instanceof Error ? err.name : 'database_error');
    return NextResponse.json(
      { success: false, error: { code: 'generation_error', message: 'Could not generate your roadmap. Please try again.' } },
      { status: 500 }
    );
  }
}
