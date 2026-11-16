import type { createClient } from './server';

export const DAY_MS = 86_400_000;
const PAGE_SIZE = 500;

type Supabase = Awaited<ReturnType<typeof createClient>>;

type PracticeActivity = {
  category: string | null;
  completed: boolean | null;
  completed_at: string | null;
  created_at: string | null;
};
type InterviewActivity = { status: string | null; created_at: string | null };

export function activityDay(value: string | number | null): string | null {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

async function readPages<T>(load: (offset: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await load(offset);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function loadProgress(supabase: Supabase, profileId: string, now = Date.now()) {
  const [allTasks, interviews, analyses] = await Promise.all([
    readPages<PracticeActivity>(offset => supabase.from('tasks')
      .select('category, completed, completed_at, created_at').eq('profile_id', profileId)
      .order('id').range(offset, offset + PAGE_SIZE - 1)),
    readPages<InterviewActivity>(offset => supabase.from('interviews')
      .select('status, created_at').eq('profile_id', profileId)
      .order('id').range(offset, offset + PAGE_SIZE - 1)),
    supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
  ]);
  if (analyses.error) throw analyses.error;

  const completedTasks = allTasks.filter(task => task.completed);
  const completedInterviews = interviews.filter(interview => interview.status === 'completed');
  const completionDays = [...new Set(completedTasks
    .map(task => activityDay(task.completed_at || task.created_at))
    .filter(day => day !== null))].sort();
  let lastDay: string | undefined;
  let run = 0;
  let longest = 0;
  for (const day of completionDays) {
    run = lastDay && Date.parse(day) - Date.parse(lastDay) === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    lastDay = day;
  }
  const current = lastDay === activityDay(now) || lastDay === activityDay(now - DAY_MS) ? run : 0;

  const stats = {
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
    totalInterviews: interviews.length,
    completedInterviews: completedInterviews.length,
    totalAnalyses: analyses.count ?? 0,
  };
  const breakdown = {
    tasks: stats.completedTasks * 10,
    interviews: stats.completedInterviews * 25,
    analyses: stats.totalAnalyses * 15,
    streakBonus: current >= 7 ? 50 : current >= 3 ? 20 : 0,
  };
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const level = Math.floor(total / 100) + 1;

  return {
    allTasks, completedTasks, interviews, stats,
    streak: { current, longest },
    xp: {
      total,
      level,
      xpProgress: total % 100,
      xpForCurrentLevel: (level - 1) * 100,
      xpForNextLevel: level * 100,
      breakdown,
    },
  };
}
