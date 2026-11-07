import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadProgress } from '@/lib/supabase/progress';

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
    const [profileResult, analysisResult, tasksResult, recsResult, progress] = await Promise.all([
      supabase.from('profiles').select('full_name, onboarding_complete, skills, goals').eq('id', user.id).maybeSingle(),
      supabase.from('analyses').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('tasks').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('company_recommendations').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      loadProgress(supabase, user.id),
    ]);

    const error = profileResult.error || analysisResult.error || tasksResult.error || recsResult.error;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        profile: profileResult.data || null,
        analysis: analysisResult.data || null,
        tasks: tasksResult.data || [],
        recommendations: recsResult.data || null,
        taskStats: { total: progress.stats.totalTasks, completed: progress.stats.completedTasks },
        streakInfo: { streak: progress.streak, xp: progress.xp },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
