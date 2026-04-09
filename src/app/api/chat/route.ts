import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chat } from '@/lib/agents/chat';

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

    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'empty_message', message: 'Message is required' } },
        { status: 400 }
      );
    }

    // Fetch chat history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Fetch student context
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, goals')
      .eq('id', user.id)
      .single();

    const { data: analysis } = await supabase
      .from('analyses')
      .select('readiness_score')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Save user message
    await supabase.from('chat_messages').insert({
      profile_id: user.id,
      role: 'user',
      content: message,
    });

    // Generate AI response
    const response = await chat({
      message,
      chat_history: (history || []) as Array<{ role: string; content: string }>,
      student_context: {
        skills: profile?.skills || [],
        readiness_score: analysis?.readiness_score || 0,
        goals: profile?.goals || [],
        current_focus: "placement preparation",
      },
    });

    // Save assistant message
    await supabase.from('chat_messages').insert({
      profile_id: user.id,
      role: 'assistant',
      content: response.response,
    });

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
      .order('created_at', { ascending: true });

    return NextResponse.json({ success: true, data: messages || [] });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
