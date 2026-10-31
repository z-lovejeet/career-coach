import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

const GUEST_EMAIL = 'guest.candidate@careerai.local';
const GUEST_PASSWORD = 'GuestCandidate123!Secure';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Ensure guest user exists and is confirmed
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
    }

    let guestUser = users?.find((u) => u.email === GUEST_EMAIL);

    if (!guestUser) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: GUEST_EMAIL,
        password: GUEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Guest Engineer (L4 Demo)' },
      });

      if (createError) {
        console.error('Error creating guest user:', createError);
        return NextResponse.json({ success: false, error: createError.message }, { status: 500 });
      }
      guestUser = created.user;
    }

    const guestId = guestUser.id;

    // 2. Ensure guest candidate profile is fully calibrated
    await supabaseAdmin.from('profiles').upsert({
      id: guestId,
      email: GUEST_EMAIL,
      full_name: 'Guest Engineer (L4 Demo)',
      phone: '+1 (555) 019-2834',
      skills: [
        'TypeScript',
        'React',
        'Next.js',
        'Node.js',
        'Python',
        'PostgreSQL',
        'Docker',
        'System Design',
        'Algorithms & Data Structures',
      ],
      skill_ratings: {
        TypeScript: 5,
        React: 5,
        'Next.js': 4,
        'Node.js': 4,
        Python: 3,
        PostgreSQL: 4,
        'System Design': 4,
        'Algorithms & Data Structures': 4,
      },
      goals: [
        'Crack Tier-1 L4 Software Engineer Screens',
        'Master Distributed Transactions & High-Throughput Caching',
        'Excel in Live Socratic Mock Coding Interviews',
      ],
      education_level: 'bachelors',
      field_of_study: 'Computer Science & Software Engineering',
      experience_level: 'intermediate',
      preferred_role: 'Full-Stack Distributed Systems Engineer',
      preferred_locations: ['San Francisco, CA', 'New York, NY', 'Remote (Global)'],
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    // 3. Ensure initial analysis exists
    const { data: existingAnalyses } = await supabaseAdmin
      .from('analyses')
      .select('id')
      .eq('profile_id', guestId)
      .limit(1);

    let analysisId = existingAnalyses?.[0]?.id;

    if (!analysisId) {
      const { data: newAnalysis, error: analysisErr } = await supabaseAdmin
        .from('analyses')
        .insert({
          profile_id: guestId,
          extracted_skills: [
            'TypeScript',
            'React',
            'Node.js',
            'PostgreSQL',
            'Docker',
            'System Design',
            'Algorithms & Data Structures',
          ],
          strengths: [
            'Full-stack TypeScript architecture and state synchronization',
            'Clean asynchronous design and low-latency database queries',
            'High familiarity with modern component architectures and SSR',
          ],
          weaknesses: [
            'Distributed consensus protocols (Raft, Paxos nuance)',
            'Multi-region cache invalidation strategies under heavy write load',
          ],
          missing_skills: ['Kafka Event Streaming', 'Redis Partitioning', 'Tree DP'],
          readiness_score: 84,
          summary:
            'Calibrated for Tier-1 L4 engineering screens. Core algorithms and web engineering are solid. Suggested 3-week focus sprint on distributed transactions and advanced graph traversal.',
          raw_response: {
            calibrated_by: 'Gemini 3.8 Flash + Groq GPT-OSS 120B Dual Engine',
          },
        })
        .select()
        .single();

      if (!analysisErr && newAnalysis) {
        analysisId = newAnalysis.id;
      }
    }

    // 4. Ensure company recommendations exist
    const { data: existingRecs } = await supabaseAdmin
      .from('company_recommendations')
      .select('id')
      .eq('profile_id', guestId)
      .limit(1);

    if (!existingRecs?.length && analysisId) {
      await supabaseAdmin.from('company_recommendations').insert({
        profile_id: guestId,
        analysis_id: analysisId,
        current_fit_companies: [
          { name: 'Stripe', role: 'Full Stack Engineer', match_score: 94, hiring_bar: 'Tier 1' },
          { name: 'Google', role: 'L4 Software Engineer', match_score: 88, hiring_bar: 'Tier 1' },
          { name: 'Vercel', role: 'Frontend Platform Engineer', match_score: 92, hiring_bar: 'Tier 1' },
        ],
        target_companies: [
          { name: 'Uber', role: 'Platform Systems Engineer', match_score: 78, gap: 'Microservice RPC latency' },
          { name: 'Netflix', role: 'Cloud Infrastructure', match_score: 75, gap: 'Distributed State' },
        ],
        skill_gaps: ['Distributed Transactions', 'Kafka Event Streaming', 'Segment Trees'],
        roadmap_to_target: [
          'Week 1: Concurrency primitives & sliding window rate limiter',
          'Week 2: Event-driven architecture with Kafka streams',
          'Week 3: Mock interview screening blitz with Groq 120B',
        ],
      });
    }

    // 5. Ensure sample active tasks exist
    const { data: existingTasks } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('profile_id', guestId)
      .limit(1);

    if (!existingTasks?.length) {
      const today = new Date().toISOString().split('T')[0];
      await supabaseAdmin.from('tasks').insert([
        {
          profile_id: guestId,
          title: 'Master LRU Cache with Doubly Linked List & Map',
          description: 'Design and implement an LRU cache with strict O(1) time complexity for get and put operations.',
          category: 'DSA & Algorithms',
          difficulty: 'Medium',
          type: 'coding',
          due_date: today,
          completed: true,
          completed_at: new Date(Date.now() - 3600000).toISOString(),
          week_number: 1,
          day_number: 1,
          priority: 1,
        },
        {
          profile_id: guestId,
          title: 'Architect Distributed Rate Limiter (Token Bucket vs Leaky Bucket)',
          description: 'Compare Redis sliding window counter vs token bucket for multi-region API rate limiting.',
          category: 'System Design',
          difficulty: 'Hard',
          type: 'architecture',
          due_date: today,
          completed: false,
          week_number: 1,
          day_number: 2,
          priority: 1,
        },
        {
          profile_id: guestId,
          title: 'Socratic Mock Interview with Groq GPT-OSS 120B: Graph Traversal',
          description: 'Complete 30-minute interactive live mock screening on cycle detection in directed graphs.',
          category: 'Mock Interview',
          difficulty: 'Hard',
          type: 'interview',
          due_date: today,
          completed: false,
          week_number: 1,
          day_number: 3,
          priority: 2,
        },
      ]);
    }

    // 6. Sign in directly on the SERVER using @supabase/ssr!
    // This writes the session cookies directly to the HTTP response on localhost!
    // No cross-origin browser requests, no CORS, no adblocker interference.
    const serverSupabase = await createServerSupabase();
    const { data: authData, error: authError } = await serverSupabase.auth.signInWithPassword({
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD,
    });

    if (authError) {
      console.error('Server signInWithPassword error:', authError);
      return NextResponse.json({ success: false, error: authError.message }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Guest session initialized and authenticated',
      redirect: '/dashboard',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown guest setup error';
    console.error('Guest setup route error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
