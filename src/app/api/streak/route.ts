import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Fetch all data in parallel
    const [allTasksRes, completedTasksRes, interviewsRes, analysesRes] = await Promise.all([
      supabase.from('tasks').select('category, completed, completed_at, created_at').eq('profile_id', user.id),
      supabase.from('tasks').select('completed_at, created_at').eq('profile_id', user.id).eq('completed', true),
      supabase.from('interviews').select('id, status, created_at').eq('profile_id', user.id),
      supabase.from('analyses').select('id, created_at').eq('profile_id', user.id),
    ]);

    const allTasks = allTasksRes.data || [];
    const completedTasks = completedTasksRes.data || [];
    const interviews = interviewsRes.data || [];
    const analyses = analysesRes.data || [];

    // === Streak Calculation ===
    let currentStreak = 0;
    let longestStreak = 0;

    const completionDates = new Set<string>();
    completedTasks.forEach(t => {
      const date = (t.completed_at || t.created_at).split('T')[0];
      completionDates.add(date);
    });

    if (completionDates.size > 0) {
      const sortedDates = [...completionDates].sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const diff = Math.round((new Date(sortedDates[i - 1]).getTime() - new Date(sortedDates[i]).getTime()) / 86400000);
          if (diff === 1) currentStreak++;
          else break;
        }
      }

      let temp = 1;
      const allDates = [...completionDates].sort();
      for (let i = 1; i < allDates.length; i++) {
        const diff = Math.round((new Date(allDates[i]).getTime() - new Date(allDates[i - 1]).getTime()) / 86400000);
        if (diff === 1) temp++;
        else { longestStreak = Math.max(longestStreak, temp); temp = 1; }
      }
      longestStreak = Math.max(longestStreak, temp);
    }

    // === XP System ===
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    const taskXP = completedTasks.length * 10;
    const interviewXP = completedInterviews.length * 25;
    const analysisXP = analyses.length * 15;
    const streakBonusXP = currentStreak >= 7 ? 50 : currentStreak >= 3 ? 20 : 0;
    const totalXP = taskXP + interviewXP + analysisXP + streakBonusXP;
    const level = Math.floor(totalXP / 100) + 1;
    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNextLevel = level * 100;
    const xpProgress = totalXP > 0 ? Math.round(((totalXP - xpForCurrentLevel) / 100) * 100) : 0;

    // === Stats ===
    const stats = {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      totalInterviews: interviews.length,
      completedInterviews: completedInterviews.length,
      totalAnalyses: analyses.length,
    };

    // === Heatmap (last 90 days) ===
    const heatmap: Array<{ date: string; count: number }> = [];
    const activityMap = new Map<string, number>();

    // Count tasks completed per day
    completedTasks.forEach(t => {
      const d = (t.completed_at || t.created_at).split('T')[0];
      activityMap.set(d, (activityMap.get(d) || 0) + 1);
    });
    // Count interviews per day
    interviews.forEach(i => {
      const d = i.created_at.split('T')[0];
      activityMap.set(d, (activityMap.get(d) || 0) + 1);
    });

    for (let i = 89; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      heatmap.push({ date, count: activityMap.get(date) || 0 });
    }

    // === Category Breakdown ===
    const categoryBreakdown: Record<string, { total: number; completed: number }> = {};
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
      { id: 'first_interview', title: 'Interview Ready', desc: 'Complete a mock interview', icon: '🎤', unlocked: completedInterviews.length >= 1 },
      { id: 'five_interviews', title: 'Interview Pro', desc: 'Complete 5 interviews', icon: '🎙️', unlocked: completedInterviews.length >= 5 },
      { id: 'first_analysis', title: 'Self-Aware', desc: 'Run your first AI analysis', icon: '🧠', unlocked: analyses.length >= 1 },
      { id: 'streak_3', title: 'Consistent', desc: 'Maintain a 3-day streak', icon: '🔥', unlocked: longestStreak >= 3 },
      { id: 'streak_7', title: 'On Fire', desc: 'Maintain a 7-day streak', icon: '🔥', unlocked: longestStreak >= 7 },
      { id: 'streak_14', title: 'Unstoppable', desc: 'Maintain a 14-day streak', icon: '💎', unlocked: longestStreak >= 14 },
      { id: 'level_5', title: 'Leveling Up', desc: 'Reach Level 5', icon: '⚡', unlocked: level >= 5 },
      { id: 'level_10', title: 'Power User', desc: 'Reach Level 10', icon: '🚀', unlocked: level >= 10 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        streak: { current: currentStreak, longest: longestStreak },
        xp: {
          total: totalXP,
          level,
          xpProgress,
          xpForCurrentLevel,
          xpForNextLevel,
          breakdown: { tasks: taskXP, interviews: interviewXP, analyses: analysisXP, streakBonus: streakBonusXP },
        },
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
