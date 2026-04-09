import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'No analysis found. Run analysis first.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
