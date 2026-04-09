import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const { topic, difficulty, num_questions = 5 } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { code: 'missing_topic', message: 'Topic is required' } },
        { status: 400 }
      );
    }

    // Get student level from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('experience_level')
      .eq('id', user.id)
      .single();

    const questions = await generateQuestions({
      topic,
      difficulty: difficulty || 'medium',
      num_questions,
      student_level: profile?.experience_level || 'fresher',
    });

    // Save interview session
    const { data: interview, error: saveError } = await supabase
      .from('interviews')
      .insert({
        profile_id: user.id,
        topic,
        difficulty: difficulty || 'medium',
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

    return NextResponse.json({ success: true, data: interviews || [] });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
