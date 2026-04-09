import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (typeof body.completed === 'boolean') {
      updates.completed = body.completed;
      updates.completed_at = body.completed ? new Date().toISOString() : null;
    }
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'update_failed', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
