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

    // Fetch all completed tasks with completion dates
    const { data: tasks } = await supabase
      .from('tasks')
      .select('completed, completed_at, created_at, category, difficulty')
      .eq('profile_id', user.id)
      .order('completed_at', { ascending: false });

    // Fetch all interviews
    const { data: interviews } = await supabase
      .from('interviews')
      .select('status, overall_score, created_at')
      .eq('profile_id', user.id);

    // Fetch analyses count
    const { data: analyses } = await supabase
      .from('analyses')
      .select('created_at')
      .eq('profile_id', user.id);

    const allTasks = tasks || [];
    const allInterviews = interviews || [];
    const allAnalyses = analyses || [];

    // --- Calculate Daily Activity ---
    const activityMap: Record<string, number> = {};

    // Tasks completed
    allTasks
      .filter(t => t.completed && t.completed_at)
      .forEach(t => {
        const date = new Date(t.completed_at).toISOString().split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
      });

    // Interviews completed
    allInterviews
      .filter(i => i.status === 'completed')
      .forEach(i => {
        const date = new Date(i.created_at).toISOString().split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
      });

    // --- Calculate Streaks ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get sorted unique active dates
    const activeDates = Object.keys(activityMap)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

    let currentStreak = 0;
    let longestStreak = 0;

    if (activeDates.length > 0) {
      // Check if today or yesterday was active (to start counting streak)
      const lastActive = activeDates[0];
      lastActive.setHours(0, 0, 0, 0);
      
      const diffFromToday = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffFromToday <= 1) {
        // Current streak is alive
        currentStreak = 1;
        for (let i = 1; i < activeDates.length; i++) {
          const prev = activeDates[i - 1];
          const curr = activeDates[i];
          prev.setHours(0, 0, 0, 0);
          curr.setHours(0, 0, 0, 0);
          const gap = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
          if (gap <= 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let tempStreak = 1;
      const sortedAsc = [...activeDates].sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < sortedAsc.length; i++) {
        const prev = new Date(sortedAsc[i - 1]);
        const curr = new Date(sortedAsc[i]);
        prev.setHours(0, 0, 0, 0);
        curr.setHours(0, 0, 0, 0);
        const gap = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (gap <= 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // --- Calculate XP ---
    const completedTasks = allTasks.filter(t => t.completed).length;
    const completedInterviews = allInterviews.filter(i => i.status === 'completed').length;
    const totalAnalyses = allAnalyses.length;

    // XP calculation
    const taskXP = completedTasks * 10;
    const interviewXP = completedInterviews * 25;
    const analysisXP = totalAnalyses * 50;
    const streakBonusXP = currentStreak >= 7 ? 100 : currentStreak >= 3 ? 30 : 0;
    const totalXP = taskXP + interviewXP + analysisXP + streakBonusXP;

    // Level calculation (exponential curve)
    const level = Math.floor(Math.sqrt(totalXP / 50)) + 1;
    const xpForCurrentLevel = Math.pow(level - 1, 2) * 50;
    const xpForNextLevel = Math.pow(level, 2) * 50;
    const xpProgress = ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    // --- Achievements ---
    const achievements = [
      { id: 'first_task', title: 'First Step', desc: 'Complete your first task', icon: '🎯', unlocked: completedTasks >= 1 },
      { id: 'task_10', title: 'Task Master', desc: 'Complete 10 tasks', icon: '⚡', unlocked: completedTasks >= 10 },
      { id: 'task_25', title: 'Grinder', desc: 'Complete 25 tasks', icon: '💪', unlocked: completedTasks >= 25 },
      { id: 'task_50', title: 'Unstoppable', desc: 'Complete 50 tasks', icon: '🔥', unlocked: completedTasks >= 50 },
      { id: 'streak_3', title: 'On Fire', desc: '3-day streak', icon: '🔥', unlocked: longestStreak >= 3 },
      { id: 'streak_7', title: 'Week Warrior', desc: '7-day streak', icon: '⚔️', unlocked: longestStreak >= 7 },
      { id: 'streak_14', title: 'Dedicated', desc: '14-day streak', icon: '🏆', unlocked: longestStreak >= 14 },
      { id: 'streak_30', title: 'Legendary', desc: '30-day streak', icon: '👑', unlocked: longestStreak >= 30 },
      { id: 'interview_1', title: 'Brave Face', desc: 'Complete first interview', icon: '🎤', unlocked: completedInterviews >= 1 },
      { id: 'interview_5', title: 'Interview Pro', desc: 'Complete 5 interviews', icon: '🌟', unlocked: completedInterviews >= 5 },
      { id: 'analysis_1', title: 'Self Aware', desc: 'Run your first AI analysis', icon: '🧠', unlocked: totalAnalyses >= 1 },
      { id: 'level_5', title: 'Rising Star', desc: 'Reach Level 5', icon: '⭐', unlocked: level >= 5 },
    ];

    // --- Build activity data for heatmap (last 90 days) ---
    const heatmapData: Array<{ date: string; count: number }> = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      heatmapData.push({ date: dateStr, count: activityMap[dateStr] || 0 });
    }

    // --- Category breakdown ---
    const categoryBreakdown: Record<string, { total: number; completed: number }> = {};
    allTasks.forEach(t => {
      const cat = t.category || 'other';
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, completed: 0 };
      categoryBreakdown[cat].total++;
      if (t.completed) categoryBreakdown[cat].completed++;
    });

    return NextResponse.json({
      success: true,
      data: {
        streak: {
          current: currentStreak,
          longest: longestStreak,
        },
        xp: {
          total: totalXP,
          level,
          xpProgress: Math.min(xpProgress, 100),
          xpForCurrentLevel,
          xpForNextLevel,
          breakdown: {
            tasks: taskXP,
            interviews: interviewXP,
            analyses: analysisXP,
            streakBonus: streakBonusXP,
          },
        },
        stats: {
          totalTasks: allTasks.length,
          completedTasks,
          totalInterviews: allInterviews.length,
          completedInterviews,
          totalAnalyses,
        },
        achievements,
        heatmap: heatmapData,
        categoryBreakdown,
      },
    });
  } catch (err) {
    console.error('Streak calculation error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
