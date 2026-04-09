import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const category = searchParams.get('category');
    const completed = searchParams.get('completed');

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', user.id)
      .order('priority', { ascending: true })
      .order('day_number', { ascending: true });

    if (week) {
      query = query.eq('week_number', parseInt(week));
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (completed !== null && completed !== undefined) {
      query = query.eq('completed', completed === 'true');
    }

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'fetch_failed', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: tasks });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
