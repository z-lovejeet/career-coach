import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLegacyGuestEmail, isGuestEmail } from '@/lib/supabase/legacy-guest';
import type { AnalyzerOutput, RecommendationOutput } from '@/types';

const demoName = 'Guest Engineer';
const demoSkills = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Design'];

function sampleTaskId(profileId: string, day: number) {
  const digest = createHash('sha256').update(`${profileId}:guest-task:${day}`).digest('hex');
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
}

const demoAnalysis: AnalyzerOutput = {
  extracted_skills: demoSkills.map((name) => ({ name, level: 'intermediate', confidence: 0.9 })),
  strengths: [
    { skill: 'TypeScript', reason: 'Comfortable modeling data and building maintainable web applications.' },
    { skill: 'React', reason: 'Understands component composition and state management.' },
  ],
  weaknesses: [{ skill: 'Distributed systems', reason: 'Practice explaining the trade-offs of replicated systems.' }],
  missing_skills: [{ skill: 'Caching', importance: 'high', reason: 'Learn how eviction and invalidation affect performance.' }],
  readiness_score: 74,
  summary: 'Sample assessment for the guest workspace. Focus on caching, graph traversal, and communicating trade-offs in mock interviews.',
};

const demoMatches: RecommendationOutput = {
  current_fit_companies: [
    { name: 'Vercel', role: 'Frontend Engineer', match_score: 86, matching_skills: ['TypeScript', 'React'], gap_skills: ['Web performance'], reason: 'The sample profile has strong foundations in frontend development.' },
    { name: 'Stripe', role: 'Software Engineer', match_score: 78, matching_skills: ['TypeScript', 'PostgreSQL'], gap_skills: ['Distributed systems'], reason: 'The sample profile combines web development and database experience.' },
  ],
  target_companies: [{ name: 'Google', role: 'Software Engineer', match_score: 69, required_skills: ['Algorithms', 'System Design'], gap_skills: ['Graph algorithms'], reason: 'Consistent algorithm practice would strengthen interview readiness.' }],
  skill_gaps: [{ skill: 'Caching', current_level: 'beginner', required_level: 'intermediate', priority: 'high' }],
  roadmap_to_target: [{ month: 1, focus: 'Caching and graph algorithms', tasks: ['Implement an LRU cache', 'Practice graph traversal'] }],
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: current } = await supabase.auth.getUser();
    let guest = current.user;
    if (guest && isLegacyGuestEmail(guest.email)) {
      await supabase.auth.signOut({ scope: 'local' });
      guest = null;
    } else if (guest && !guest.is_anonymous && !guest.user_metadata?.is_guest && !isGuestEmail(guest.email)) {
      return NextResponse.json({ success: false, error: 'Sign out of your account before starting a guest session.' }, { status: 409 });
    }

    if (!guest) {
      const { captchaToken } = await request.json().catch(() => null) ?? {};
      let { data, error } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: demoName }, captchaToken: typeof captchaToken === 'string' ? captchaToken : undefined },
      });

      // If anonymous auth provider is disabled in Supabase, fall back seamlessly to an isolated guest session
      if (error && error.code === 'anonymous_provider_disabled') {
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (url && key) {
          const admin = createServiceClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const guestId = randomUUID();
          const guestEmail = `guest.${guestId}@careerai.local`;
          const guestPassword = randomBytes(24).toString('hex');

          const { data: created, error: createError } = await admin.auth.admin.createUser({
            email: guestEmail,
            password: guestPassword,
            email_confirm: true,
            user_metadata: { full_name: demoName, is_guest: true },
          });

          if (!createError && created?.user) {
            const signInRes = await supabase.auth.signInWithPassword({
              email: guestEmail,
              password: guestPassword,
            });
            if (signInRes.data?.user && signInRes.data?.session) {
              data = signInRes.data;
              error = null;
            }
          }
        }
      }

      if (error || !data?.user || !data?.session) {
        const message = error?.code === 'captcha_failed'
          ? 'Please complete the verification and try again.'
          : error?.status === 429 ? 'Too many attempts. Please try again later.' : 'Guest access is temporarily unavailable.';
        return NextResponse.json({ success: false, error: message }, { status: error?.status === 429 ? 429 : 503 });
      }
      guest = data.user;
    }

    const profileId = guest.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('onboarding_complete').eq('id', profileId).maybeSingle();
    if (profileError) throw profileError;

    if (!profile?.onboarding_complete) {
      if (!profile) {
        const { error } = await supabase.from('profiles').upsert({ id: profileId }, { ignoreDuplicates: true });
        if (error) throw error;
      }

      const { data: existingAnalysis, error: analysisError } = await supabase
        .from('analyses').select('id').eq('profile_id', profileId).limit(1).maybeSingle();
      if (analysisError) throw analysisError;

      const analysisId = existingAnalysis?.id ?? profileId;
      if (!existingAnalysis) {
        const { error } = await supabase.from('analyses').upsert({
          id: analysisId, profile_id: profileId, ...demoAnalysis, raw_response: { sample: true },
        }, { ignoreDuplicates: true });
        if (error) throw error;
      }

      const [matches, tasks] = await Promise.all([
        supabase.from('company_recommendations').select('id').eq('profile_id', profileId).limit(1).maybeSingle(),
        supabase.from('tasks').select('id').eq('profile_id', profileId).limit(1).maybeSingle(),
      ]);
      if (matches.error || tasks.error) throw matches.error ?? tasks.error;

      if (!matches.data) {
        const { error } = await supabase.from('company_recommendations')
          .upsert({ id: profileId, profile_id: profileId, analysis_id: analysisId, ...demoMatches }, { ignoreDuplicates: true });
        if (error) throw error;
      }
      if (!tasks.data) {
        const today = new Date().toISOString().slice(0, 10);
        const { error } = await supabase.from('tasks').upsert([
          { title: 'Implement an LRU cache', description: 'Use a hash map and a doubly linked list for constant-time reads and writes.', category: 'dsa', difficulty: 'medium', day_number: 1, completed: true, completed_at: new Date().toISOString() },
          { title: 'Design a rate limiter', description: 'Compare a token bucket with a sliding window and explain how each handles bursts.', category: 'system_design', difficulty: 'hard', day_number: 2 },
          { title: 'Practice graph traversal', description: 'Explain how to detect a cycle in a directed graph during an interview.', category: 'dsa', difficulty: 'medium', day_number: 3 },
        ].map((task) => ({
          id: sampleTaskId(profileId, task.day_number), profile_id: profileId, analysis_id: analysisId,
          type: 'daily', week_number: 1, priority: 1, due_date: today, completed: false, completed_at: null, ...task,
        })), { ignoreDuplicates: true });
        if (error) throw error;
      }

      const { error } = await supabase.from('profiles').update({
        full_name: demoName,
        skills: demoSkills,
        skill_ratings: { TypeScript: 7, React: 7, 'Node.js': 6, PostgreSQL: 6, 'System Design': 5 },
        goals: ['Prepare for technical interviews', 'Get better at system design'],
        education_level: 'B.Sc',
        field_of_study: 'Computer Science',
        experience_level: '1-3',
        preferred_role: 'Software Engineer',
        preferred_locations: ['Remote'],
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }).eq('id', profileId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, redirect: '/dashboard', user: { id: profileId } });
  } catch {
    return NextResponse.json({ success: false, error: 'Guest workspace setup was interrupted. Please try again.' }, { status: 503 });
  }
}
