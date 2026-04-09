import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Fetch latest analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { success: false, error: { code: 'no_analysis', message: 'Run profile analysis first' } },
        { status: 400 }
      );
    }

    // Fetch recommendations
    const { data: recs } = await supabase
      .from('company_recommendations')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch profile goals
    const { data: profile } = await supabase
      .from('profiles')
      .select('goals')
      .eq('id', user.id)
      .single();

    // Count existing weeks of tasks
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('week_number')
      .eq('profile_id', user.id)
      .order('week_number', { ascending: false })
      .limit(1);

    const currentWeek = (existingTasks?.[0]?.week_number || 0) + 1;

    const input: PlannerInput = {
      analysis: {
        extracted_skills: analysis.extracted_skills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missing_skills: analysis.missing_skills,
        readiness_score: analysis.readiness_score,
        summary: analysis.summary,
      },
      recommendations: {
        current_fit_companies: recs?.current_fit_companies || [],
        target_companies: recs?.target_companies || [],
        skill_gaps: recs?.skill_gaps || [],
        roadmap_to_target: recs?.roadmap_to_target || [],
      },
      goals: profile?.goals || [],
      available_hours_per_day: 3,
      current_week: currentWeek,
    };

    // Generate plan
    const plan = await generateWeeklyPlan(input);

    // Save tasks to database
    const tasksToInsert = plan.weekly_plan.tasks.map(task => ({
      profile_id: user.id,
      analysis_id: analysis.id,
      title: task.title,
      description: task.description,
      category: task.category,
      difficulty: task.difficulty,
      type: task.type,
      day_number: task.day_number,
      week_number: plan.weekly_plan.week_number || currentWeek,
      priority: task.priority,
      completed: false,
    }));

    const { data: savedTasks, error: saveError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (saveError) {
      return NextResponse.json(
        { success: false, error: { code: 'save_failed', message: saveError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        week_number: currentWeek,
        theme: plan.weekly_plan.theme,
        tasks: savedTasks,
      },
    });
  } catch (err) {
    console.error('Task generation error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Task generation failed. Please try again.' } },
      { status: 500 }
    );
  }
}
