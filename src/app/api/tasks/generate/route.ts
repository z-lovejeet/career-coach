import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { generateWeeklyPlan } from '@/lib/agents/planner';
import type { PlannerInput } from '@/types';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const [latestAnalysis, latestRecommendations, candidate, latestWeek] = await Promise.all([
      supabase.from('analyses').select('*').eq('profile_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('company_recommendations').select('*').eq('profile_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('goals').eq('id', user.id).maybeSingle(),
      supabase.from('tasks').select('week_number').eq('profile_id', user.id)
        .order('week_number', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
    ]);
    const error = latestAnalysis.error || latestRecommendations.error || candidate.error || latestWeek.error;
    if (error) throw error;

    const analysis = latestAnalysis.data;
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: { code: 'no_analysis', message: 'Run profile analysis first.' } },
        { status: 400 }
      );
    }

    const currentWeek = (latestWeek.data?.week_number || 0) + 1;
    const recommendations = latestRecommendations.data;
    const input: PlannerInput = {
      analysis: {
        extracted_skills: analysis.extracted_skills || [],
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        missing_skills: analysis.missing_skills || [],
        readiness_score: analysis.readiness_score,
        summary: analysis.summary,
      },
      recommendations: {
        current_fit_companies: recommendations?.current_fit_companies || [],
        target_companies: recommendations?.target_companies || [],
        skill_gaps: recommendations?.skill_gaps || [],
        roadmap_to_target: recommendations?.roadmap_to_target || [],
      },
      goals: candidate.data?.goals || [],
      available_hours_per_day: 3,
      current_week: currentWeek,
    };

    const quota = await enforceAIQuota(supabase, 'tasks');
    if (quota) return quota;
    const plan = await generateWeeklyPlan(input);
    const { data: tasks, error: saveError } = await supabase.rpc('save_weekly_tasks', {
      p_analysis_id: analysis.id,
      p_week_number: currentWeek,
      p_tasks: plan.weekly_plan.tasks,
    });
    if (saveError) throw saveError;
    if (!tasks?.length) {
      return NextResponse.json(
        { success: false, error: { code: 'week_exists', message: 'This week already has a plan. Refresh to see it.' } },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { week_number: currentWeek, theme: plan.weekly_plan.theme, tasks },
    });
  } catch (err) {
    console.error('Task generation error:', err instanceof Error ? err.name : 'database_error');
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Task generation failed. Please try again.' } },
      { status: 500 }
    );
  }
}
