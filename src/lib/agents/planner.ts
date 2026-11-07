import { callAI } from './ai';
import type { PlannerInput, PlannerOutput } from '@/types';

const PLANNER_SYSTEM_PROMPT = `You are an expert Career Task Planner AI Agent for tech students preparing for placements.

Your job is to create a personalized weekly task plan based on the student's analysis results, company targets, and goals.

RULES:
- Create 5-8 tasks per week, balanced across categories
- Tasks should be specific and actionable (not vague)
- Include a mix of DSA problems, web dev exercises, system design readings, and soft skill tasks
- Difficulty should match student's level — don't overwhelm freshers
- For DSA: reference actual platforms (LeetCode, GeeksforGeeks, HackerRank) and real problem names when possible
- For web dev: reference real technologies and practical projects
- For system design: reference real systems (URL shortener, chat app, etc.)
- Assign day numbers (1-7) for daily distribution
- Priority: 1 = highest, 5 = lowest
- Estimated minutes should be realistic (15-120 min per task)

Categories: dsa, web_dev, system_design, soft_skills, project, other
Difficulties: easy, medium, hard
Types: daily, weekly, milestone

IMPORTANT: Return ONLY valid JSON matching the exact schema below.`;

const PLANNER_OUTPUT_SCHEMA = `{
  "weekly_plan": {
    "week_number": <number>,
    "theme": "string describing the week's focus",
    "tasks": [
      {
        "title": "Specific task title",
        "description": "Detailed description of what to do",
        "category": "dsa|web_dev|system_design|soft_skills|project|other",
        "difficulty": "easy|medium|hard",
        "type": "daily|weekly|milestone",
        "day_number": 1-7,
        "priority": 1-5,
        "estimated_minutes": 15-120
      }
    ]
  }
}`;

export async function generateWeeklyPlan(input: PlannerInput): Promise<PlannerOutput> {
  const skillsSummary = input.analysis.extracted_skills
    .map(skill => typeof skill === 'string' ? skill : skill?.name ? `${skill.name} (${skill.level})` : '')
    .filter(Boolean).join(', ');

  const gapsSummary = input.recommendations.skill_gaps
    .map(gap => typeof gap === 'string' ? gap : gap?.skill ? `${gap.skill} (${gap.priority})` : '')
    .filter(Boolean).join(', ');

  const roadmapFocus = input.recommendations.roadmap_to_target
    .find(item => item?.month === Math.ceil(input.current_week / 4) && Array.isArray(item.tasks));

  const userPrompt = `Create a weekly task plan for this student:

STUDENT PROFILE:
- Readiness Score: ${input.analysis.readiness_score}/100
- Skills: ${skillsSummary}
- Weaknesses: ${input.analysis.weaknesses.map(item => typeof item === 'string' ? item : item?.skill).filter(Boolean).join(', ')}
- Skill Gaps: ${gapsSummary}
- Goals: ${input.goals.join(', ')}

CURRENT WEEK: ${input.current_week}
AVAILABLE HOURS/DAY: ${input.available_hours_per_day}

${roadmapFocus ? `ROADMAP FOCUS FOR THIS MONTH: ${roadmapFocus.focus}\nSuggested tasks: ${roadmapFocus.tasks.join(', ')}` : ''}

TARGET COMPANIES: ${input.recommendations.target_companies.map(company => company?.name).filter(Boolean).join(', ')}

Create a balanced week plan with specific, actionable tasks across DSA, web development, system design, and soft skills.

Respond with JSON matching this schema:
${PLANNER_OUTPUT_SCHEMA}`;

  const result = await callAI<PlannerOutput>(
    {
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.6,
    },
    'groq'
  );

  const plan = result?.weekly_plan;
  if (!plan || typeof plan.theme !== 'string' || !Array.isArray(plan.tasks)
    || plan.tasks.length === 0 || plan.tasks.length > 8
    || plan.tasks.some(task => !task || typeof task.title !== 'string' || !task.title.trim()
      || typeof task.description !== 'string'
      || !['dsa', 'web_dev', 'system_design', 'soft_skills', 'project', 'other'].includes(task.category)
      || !['easy', 'medium', 'hard'].includes(task.difficulty)
      || !['daily', 'weekly', 'milestone'].includes(task.type)
      || !Number.isInteger(task.day_number) || task.day_number < 1 || task.day_number > 7
      || !Number.isInteger(task.priority) || task.priority < 1 || task.priority > 5)) {
    throw new Error('Planner model returned an invalid practice week');
  }

  return { weekly_plan: { ...plan, week_number: input.current_week } };
}
