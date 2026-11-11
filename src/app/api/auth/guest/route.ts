import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isLegacyGuestEmail, isGuestEmail } from '@/lib/supabase/legacy-guest';
import type { AnalyzerOutput, RecommendationOutput } from '@/types';

const demoName = 'Guest Engineer';
const demoSkills = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Design'];

const SHARED_GUEST_EMAIL = 'guest.demo@careerai.local';
const SHARED_GUEST_PASSWORD = 'GuestDemo12345!Secure';

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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const admin = url && serviceKey
      ? createServiceClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    // 1. Check current session
    const { data: current } = await supabase.auth.getUser();
    let guest = current?.user ?? null;

    if (guest && isLegacyGuestEmail(guest.email)) {
      await supabase.auth.signOut({ scope: 'local' });
      guest = null;
    } else if (guest && !guest.is_anonymous && !guest.user_metadata?.is_guest && !isGuestEmail(guest.email)) {
      // User is logged into a real account, sign out locally to allow guest access
      await supabase.auth.signOut({ scope: 'local' });
      guest = null;
    }

    // 2. If not already an active guest, authenticate
    if (!guest) {
      let authenticated = false;

      // Strategy A: Try creating an isolated guest session
      if (admin) {
        try {
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
              guest = signInRes.data.user;
              authenticated = true;
            }
          }
        } catch (err) {
          console.warn('[guest-auth] Isolated guest user creation failed, will try fallback:', err);
        }
      }

      // Strategy B: Fallback to the dedicated shared demo guest account
      if (!authenticated) {
        try {
          let signInRes = await supabase.auth.signInWithPassword({
            email: SHARED_GUEST_EMAIL,
            password: SHARED_GUEST_PASSWORD,
          });

          if (signInRes.error && admin) {
            // User doesn't exist yet, create it with admin
            await admin.auth.admin.createUser({
              email: SHARED_GUEST_EMAIL,
              password: SHARED_GUEST_PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: demoName, is_guest: true },
            });

            signInRes = await supabase.auth.signInWithPassword({
              email: SHARED_GUEST_EMAIL,
              password: SHARED_GUEST_PASSWORD,
            });
          }

          if (signInRes.data?.user && signInRes.data?.session) {
            guest = signInRes.data.user;
            authenticated = true;
          }
        } catch (err) {
          console.error('[guest-auth] Shared guest sign-in error:', err);
        }
      }

      // Strategy C: Last resort anonymous sign-in (if enabled in project)
      if (!authenticated) {
        const { captchaToken } = await request.json().catch(() => null) ?? {};
        const anonRes = await supabase.auth.signInAnonymously({
          options: {
            data: { full_name: demoName },
            captchaToken: typeof captchaToken === 'string' ? captchaToken : undefined,
          },
        });

        if (anonRes.data?.user && anonRes.data?.session) {
          guest = anonRes.data.user;
          authenticated = true;
        }
      }

      if (!guest) {
        return NextResponse.json(
          { success: false, error: 'Guest access is temporarily unavailable. Please try again or sign in with Google.' },
          { status: 503 }
        );
      }
    }

    // 3. Ensure demo data exists for this guest
    const profileId = guest.id;
    const dbClient = admin ?? supabase;

    const { data: profile } = await dbClient
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', profileId)
      .maybeSingle();

    if (!profile?.onboarding_complete) {
      // Upsert profile
      await dbClient.from('profiles').upsert({
        id: profileId,
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
      }, { onConflict: 'id' });

      // Upsert analysis
      const analysisId = profileId;
      await dbClient.from('analyses').upsert({
        id: analysisId,
        profile_id: profileId,
        ...demoAnalysis,
        raw_response: { sample: true },
      }, { onConflict: 'id' });

      // Upsert company recommendations
      await dbClient.from('company_recommendations').upsert({
        id: profileId,
        profile_id: profileId,
        analysis_id: analysisId,
        ...demoMatches,
      }, { onConflict: 'id' });

      // Upsert demo tasks
      const today = new Date().toISOString().slice(0, 10);
      await dbClient.from('tasks').upsert([
        {
          id: sampleTaskId(profileId, 1),
          profile_id: profileId,
          analysis_id: analysisId,
          type: 'daily',
          week_number: 1,
          priority: 1,
          due_date: today,
          title: 'Implement an LRU cache',
          description: 'Use a hash map and a doubly linked list for constant-time reads and writes.',
          category: 'dsa',
          difficulty: 'medium',
          day_number: 1,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          id: sampleTaskId(profileId, 2),
          profile_id: profileId,
          analysis_id: analysisId,
          type: 'daily',
          week_number: 1,
          priority: 1,
          due_date: today,
          title: 'Design a rate limiter',
          description: 'Compare a token bucket with a sliding window and explain how each handles bursts.',
          category: 'system_design',
          difficulty: 'hard',
          day_number: 2,
          completed: false,
        },
        {
          id: sampleTaskId(profileId, 3),
          profile_id: profileId,
          analysis_id: analysisId,
          type: 'daily',
          week_number: 1,
          priority: 1,
          due_date: today,
          title: 'Practice graph traversal',
          description: 'Explain how to detect a cycle in a directed graph during an interview.',
          category: 'dsa',
          difficulty: 'medium',
          day_number: 3,
          completed: false,
        },
      ], { onConflict: 'id' });
    }

    return NextResponse.json({ success: true, redirect: '/dashboard', user: { id: profileId } });
  } catch (err) {
    console.error('[guest-auth] Unexpected error during guest setup:', err);
    return NextResponse.json(
      { success: false, error: 'Guest workspace setup was interrupted. Please try again.' },
      { status: 503 }
    );
  }
}
