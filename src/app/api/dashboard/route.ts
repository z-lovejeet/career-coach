import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Combined dashboard endpoint — returns profile, analysis, tasks,
 * recommendations, and streak in ONE API call instead of 5 separate ones.
 */
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

    // Run ALL queries in parallel — single auth check, multiple data fetches
    const [profileResult, analysisResult, tasksResult, recsResult, completedResult] = await Promise.all([
      supabase.from('profiles').select('full_name, onboarding_complete, skills, goals').eq('id', user.id).single(),
      supabase.from('analyses').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('tasks').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('company_recommendations').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('tasks').select('completed_at, created_at').eq('profile_id', user.id).eq('completed', true),
    ]);

    // Calculate streak from completed tasks
    const completedTasks = completedResult.data || [];
    let currentStreak = 0;
    let longestStreak = 0;

    if (completedTasks.length > 0) {
      const dates = new Set<string>();
      completedTasks.forEach((t: { completed_at: string | null; created_at: string }) => {
        dates.add((t.completed_at || t.created_at).split('T')[0]);
      });

      const sorted = [...dates].sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (sorted[0] === today || sorted[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = Math.round((new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / 86400000);
          if (diff === 1) currentStreak++;
          else break;
        }
      }

      let temp = 1;
      const all = [...dates].sort();
      for (let i = 1; i < all.length; i++) {
        const diff = Math.round((new Date(all[i]).getTime() - new Date(all[i - 1]).getTime()) / 86400000);
        if (diff === 1) temp++;
        else { longestStreak = Math.max(longestStreak, temp); temp = 1; }
      }
      longestStreak = Math.max(longestStreak, temp);
    }

    const totalXP = completedTasks.length * 10;

    return NextResponse.json({
      success: true,
      data: {
        profile: profileResult.data || null,
        analysis: analysisResult.data || null,
        tasks: tasksResult.data || [],
        recommendations: recsResult.data || null,
        streakInfo: {
          streak: { current: currentStreak, longest: longestStreak },
          xp: { total: totalXP, level: Math.floor(totalXP / 100) + 1, xpProgress: totalXP % 100 },
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
