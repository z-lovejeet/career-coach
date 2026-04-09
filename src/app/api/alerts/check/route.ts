import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * AGENTIC ALERT ENGINE
 * 
 * This runs on every dashboard load and PROACTIVELY detects issues:
 * - Overdue/missed tasks → escalating urgency
 * - Weak skill areas with no practice → suggests action
 * - Long inactivity → nudge to return
 * - No analysis yet → prompt to start
 * - Streak at risk → motivation alert
 * 
 * This is the "agentic behavior" — the AI DECIDES to alert, not the user.
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

    // Fetch all relevant data in parallel
    const [profileRes, analysisRes, tasksRes, interviewsRes, completedRes] = await Promise.all([
      supabase.from('profiles').select('onboarding_complete, skills, goals, created_at').eq('id', user.id).single(),
      supabase.from('analyses').select('readiness_score, weaknesses, missing_skills, created_at').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('tasks').select('id, title, category, completed, due_date, created_at').eq('profile_id', user.id),
      supabase.from('interviews').select('id, status, created_at').eq('profile_id', user.id),
      supabase.from('tasks').select('completed_at').eq('profile_id', user.id).eq('completed', true).order('completed_at', { ascending: false }).limit(1),
    ]);

    const profile = profileRes.data;
    const analysis = analysisRes.data;
    const tasks = tasksRes.data || [];
    const interviews = interviewsRes.data || [];
    const lastCompleted = completedRes.data?.[0];

    interface Alert {
      id: string;
      type: 'action' | 'warning' | 'critical' | 'info' | 'motivation';
      title: string;
      message: string;
      action?: { label: string; href: string };
      icon: string;
    }

    const alerts: Alert[] = [];
    const now = new Date();

    // === CRITICAL: Onboarding not complete ===
    if (!profile?.onboarding_complete) {
      alerts.push({
        id: 'onboarding_incomplete',
        type: 'critical',
        title: '⚠️ Complete Your Profile',
        message: 'Your profile setup is incomplete. The AI needs your skills, goals, and resume to create a personalized roadmap.',
        action: { label: 'Complete Setup', href: '/onboarding' },
        icon: '🚨',
      });
    }

    // === CRITICAL: No AI analysis yet ===
    if (profile?.onboarding_complete && !analysis) {
      alerts.push({
        id: 'no_analysis',
        type: 'action',
        title: '🧠 Run AI Analysis',
        message: 'I need to analyze your skills to create a personalized plan. This takes ~30 seconds and unlocks all features.',
        action: { label: 'Analyze Now', href: '/companies' },
        icon: '🧠',
      });
    }

    // === ACTION: No tasks generated ===
    if (analysis && tasks.length === 0) {
      alerts.push({
        id: 'no_tasks',
        type: 'action',
        title: '📋 I\'ve prepared tasks for you',
        message: `Based on your readiness score of ${analysis.readiness_score}/100, I\'ve identified areas to improve. Let me generate your personalized weekly plan.`,
        action: { label: 'Generate Tasks', href: '/tasks' },
        icon: '📋',
      });
    }

    // === WARNING: Overdue tasks ===
    const incompleteTasks = tasks.filter(t => !t.completed);
    const overdueTasks = incompleteTasks.filter(t => {
      if (!t.due_date) {
        // Tasks older than 3 days without completion are considered overdue
        const created = new Date(t.created_at);
        const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / 86400000);
        return daysSinceCreated >= 3;
      }
      return new Date(t.due_date) < now;
    });

    if (overdueTasks.length >= 5) {
      alerts.push({
        id: 'many_overdue',
        type: 'critical',
        title: '🚨 Multiple Deadlines Missed',
        message: `You have ${overdueTasks.length} overdue tasks. This pattern suggests you may need to adjust your study plan. I recommend reducing daily goals or focusing on fewer categories.`,
        action: { label: 'Review Tasks', href: '/tasks' },
        icon: '🚨',
      });
    } else if (overdueTasks.length >= 3) {
      alerts.push({
        id: 'overdue_warning',
        type: 'warning',
        title: '⚠️ 3+ Deadlines Missed',
        message: `You have ${overdueTasks.length} overdue tasks. Missing deadlines consistently will hurt your placement readiness. Let's get back on track.`,
        action: { label: 'Catch Up', href: '/tasks' },
        icon: '⚠️',
      });
    } else if (overdueTasks.length >= 1) {
      alerts.push({
        id: 'some_overdue',
        type: 'info',
        title: '📌 Pending Tasks',
        message: `You have ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} waiting: "${overdueTasks[0].title}"${overdueTasks.length > 1 ? ' and more' : ''}`,
        action: { label: 'View Tasks', href: '/tasks' },
        icon: '📌',
      });
    }

    // === WARNING: Weak areas with no practice ===
    if (analysis?.weaknesses && Array.isArray(analysis.weaknesses)) {
      const weakSkills = (analysis.weaknesses as Array<{ skill: string }>).map(w => w.skill);
      const taskCategories = new Set(tasks.filter(t => t.completed).map(t => t.category));
      
      // Map weakness skills to categories
      const weaknessToCategory: Record<string, string> = {
        'DSA': 'dsa', 'Data Structures': 'dsa', 'Algorithms': 'dsa',
        'System Design': 'system_design', 'Web Development': 'web_dev',
        'Communication': 'soft_skills', 'Leadership': 'soft_skills',
      };

      const unpracticedWeaknesses = weakSkills.filter(skill => {
        const cat = weaknessToCategory[skill] || '';
        return cat && !taskCategories.has(cat);
      });

      if (unpracticedWeaknesses.length > 0) {
        alerts.push({
          id: 'unpracticed_weakness',
          type: 'action',
          title: `🎯 Weak in ${unpracticedWeaknesses[0]} — Practice Needed`,
          message: `I detected you're weak in ${unpracticedWeaknesses.join(', ')} but haven't practiced these areas yet. I recommend focusing on these to improve your placement readiness.`,
          action: { label: 'Start Practice', href: '/tasks' },
          icon: '🎯',
        });
      }
    }

    // === WARNING: Missing critical skills ===
    if (analysis?.missing_skills && Array.isArray(analysis.missing_skills)) {
      const criticalMissing = (analysis.missing_skills as Array<{ skill: string; importance: string }>)
        .filter(s => s.importance === 'critical' || s.importance === 'high');
      
      if (criticalMissing.length > 0) {
        alerts.push({
          id: 'critical_skills_missing',
          type: 'warning',
          title: '⚡ Critical Skill Gaps Detected',
          message: `You're missing ${criticalMissing.length} critical skills: ${criticalMissing.slice(0, 3).map(s => s.skill).join(', ')}. These are essential for your target roles.`,
          action: { label: 'View Roadmap', href: '/roadmap' },
          icon: '⚡',
        });
      }
    }

    // === MOTIVATION: Inactivity detection ===
    if (lastCompleted) {
      const lastActiveDate = new Date(lastCompleted.completed_at);
      const daysSinceActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / 86400000);
      
      if (daysSinceActive >= 7) {
        alerts.push({
          id: 'long_inactive',
          type: 'critical',
          title: '📉 Inactive for a Week',
          message: `You haven't completed any tasks in ${daysSinceActive} days. Consistency is key for placement prep. Even 30 minutes daily makes a big difference.`,
          action: { label: 'Resume Tasks', href: '/tasks' },
          icon: '📉',
        });
      } else if (daysSinceActive >= 3) {
        alerts.push({
          id: 'inactive',
          type: 'warning',
          title: '🔔 Getting Off Track',
          message: `It's been ${daysSinceActive} days since your last activity. Your streak is at risk! Come back and maintain your momentum.`,
          action: { label: 'Continue', href: '/tasks' },
          icon: '🔔',
        });
      }
    }

    // === MOTIVATION: No mock interviews ===
    if (analysis && interviews.length === 0) {
      alerts.push({
        id: 'no_interviews',
        type: 'info',
        title: '🎤 Try Mock Interviews',
        message: 'You haven\'t practiced any interviews yet. Mock interviews are crucial — companies test communication as much as coding.',
        action: { label: 'Start Interview', href: '/interview' },
        icon: '🎤',
      });
    }

    // === MOTIVATION: Low readiness score ===
    if (analysis && analysis.readiness_score < 40) {
      alerts.push({
        id: 'low_readiness',
        type: 'info',
        title: '💪 Your Readiness: ' + analysis.readiness_score + '/100',
        message: 'Your placement readiness is below average. The good news? With focused practice, you can improve significantly in 2-4 weeks.',
        action: { label: 'View Plan', href: '/roadmap' },
        icon: '💪',
      });
    }

    // Sort: critical > warning > action > info > motivation
    const priority: Record<string, number> = { critical: 0, warning: 1, action: 2, info: 3, motivation: 4 };
    alerts.sort((a, b) => (priority[a.type] ?? 5) - (priority[b.type] ?? 5));

    return NextResponse.json({ success: true, data: { alerts } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
