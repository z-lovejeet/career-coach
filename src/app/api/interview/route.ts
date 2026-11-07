import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { generateQuestions } from '@/lib/agents/interview';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
    const difficulty = body?.difficulty ?? 'medium';
    const num_questions = body?.num_questions ?? 5;

    if (!topic || topic.length > 160 || !['easy', 'medium', 'hard'].includes(difficulty)
      || !Number.isInteger(num_questions) || num_questions < 1 || num_questions > 10) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_interview', message: 'Choose a topic, difficulty, and between 1 and 10 questions.' } },
        { status: 400 }
      );
    }

    // Get student level from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('experience_level')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const quota = await enforceAIQuota(supabase, 'interview-start');
    if (quota) return quota;

    const questions = await generateQuestions({
      topic,
      difficulty,
      num_questions,
      student_level: profile?.experience_level || 'fresher',
    });

    // Save interview session
    const { data: interview, error: saveError } = await supabase
      .from('interviews')
      .insert({
        profile_id: user.id,
        topic,
        difficulty,
        questions,
        answers: [],
        evaluations: [],
        status: 'in_progress',
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { success: false, error: { code: 'save_failed', message: saveError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: interview });
  } catch (err) {
    console.error('Interview start error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Failed to generate questions' } },
      { status: 500 }
    );
  }
}

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

    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'fetch_failed', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: interviews || [] });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
