import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activityDay, DAY_MS, loadProgress } from '@/lib/supabase/progress';

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

    const now = Date.now();
    const { allTasks, completedTasks, interviews, stats, streak, xp } = await loadProgress(supabase, user.id, now);

    // === Heatmap (last 90 days) ===
    const heatmap: Array<{ date: string; count: number }> = [];
    const activityMap = new Map<string, number>();

    // Count tasks completed per day
    completedTasks.forEach(t => {
      const day = activityDay(t.completed_at || t.created_at);
      if (day) activityMap.set(day, (activityMap.get(day) || 0) + 1);
    });
    // Count interviews per day
    interviews.forEach(i => {
      const day = activityDay(i.created_at);
      if (day) activityMap.set(day, (activityMap.get(day) || 0) + 1);
    });

    for (let i = 89; i >= 0; i--) {
      const date = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
      heatmap.push({ date, count: activityMap.get(date) || 0 });
    }

    // === Category Breakdown ===
    const categoryBreakdown: Record<string, { total: number; completed: number }> = Object.create(null);
    allTasks.forEach(t => {
      const cat = t.category || 'other';
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, completed: 0 };
      categoryBreakdown[cat].total++;
      if (t.completed) categoryBreakdown[cat].completed++;
    });

    // === Achievements ===
    const achievements = [
      { id: 'first_task', title: 'First Step', desc: 'Complete your first task', icon: '🎯', unlocked: completedTasks.length >= 1 },
      { id: 'five_tasks', title: 'Getting Started', desc: 'Complete 5 tasks', icon: '⭐', unlocked: completedTasks.length >= 5 },
      { id: 'ten_tasks', title: 'Dedicated', desc: 'Complete 10 tasks', icon: '🌟', unlocked: completedTasks.length >= 10 },
      { id: 'twenty_tasks', title: 'Committed', desc: 'Complete 20 tasks', icon: '💪', unlocked: completedTasks.length >= 20 },
      { id: 'first_interview', title: 'Interview Ready', desc: 'Complete a mock interview', icon: '🎤', unlocked: stats.completedInterviews >= 1 },
      { id: 'five_interviews', title: 'Interview Pro', desc: 'Complete 5 interviews', icon: '🎙️', unlocked: stats.completedInterviews >= 5 },
      { id: 'first_analysis', title: 'Self-Aware', desc: 'Run your first AI analysis', icon: '🧠', unlocked: stats.totalAnalyses >= 1 },
      { id: 'streak_3', title: 'Consistent', desc: 'Maintain a 3-day streak', icon: '🔥', unlocked: streak.longest >= 3 },
      { id: 'streak_7', title: 'On Fire', desc: 'Maintain a 7-day streak', icon: '🔥', unlocked: streak.longest >= 7 },
      { id: 'streak_14', title: 'Unstoppable', desc: 'Maintain a 14-day streak', icon: '💎', unlocked: streak.longest >= 14 },
      { id: 'level_5', title: 'Leveling Up', desc: 'Reach Level 5', icon: '⚡', unlocked: xp.level >= 5 },
      { id: 'level_10', title: 'Power User', desc: 'Reach Level 10', icon: '🚀', unlocked: xp.level >= 10 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        streak,
        xp,
        stats,
        achievements,
        heatmap,
        categoryBreakdown,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
