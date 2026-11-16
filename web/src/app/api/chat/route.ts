import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { chat } from '@/lib/agents/chat';

const MAX_MESSAGE_LENGTH = 8000;

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
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_message', message: 'Enter a message of up to 8,000 characters.' } },
        { status: 400 }
      );
    }

    const [history, profile, analysis] = await Promise.all([
      supabase.from('chat_messages').select('role, content')
        .eq('profile_id', user.id).order('created_at', { ascending: false }).order('role').order('id').limit(20),
      supabase.from('profiles').select('skills, goals').eq('id', user.id).maybeSingle(),
      supabase.from('analyses').select('readiness_score')
        .eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (history.error || profile.error || analysis.error) {
      throw history.error || profile.error || analysis.error;
    }

    const quota = await enforceAIQuota(supabase, 'chat');
    if (quota) return quota;

    const response = await chat({
      message,
      chat_history: (history.data || []).toReversed(),
      student_context: {
        skills: profile.data?.skills || [],
        readiness_score: analysis.data?.readiness_score || 0,
        goals: profile.data?.goals || [],
        current_focus: 'placement preparation',
      },
    });

    if (typeof response?.response !== 'string' || !response.response.trim()) {
      throw new Error('Chat model returned an empty response');
    }

    // One statement commits the exchange together. The role tie-break places the
    // user first when both rows share Postgres's transaction timestamp.
    const { error: saveError } = await supabase.from('chat_messages').insert([
      { profile_id: user.id, role: 'user', content: message },
      { profile_id: user.id, role: 'assistant', content: response.response },
    ]);
    if (saveError) throw saveError;

    return NextResponse.json({ success: true, data: response });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Chat failed. Please try again.' } },
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

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .order('role')
      .order('id');

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'fetch_failed', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: (messages || []).toReversed() });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
