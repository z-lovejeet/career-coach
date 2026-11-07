import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResumePath, RESUME_ENDPOINT } from '@/lib/supabase/resume';

function profileResponse(profile: Record<string, unknown>, userId: string) {
  return NextResponse.json({
    success: true,
    data: { ...profile, resume_url: getResumePath(profile.resume_url, userId) ? RESUME_ENDPOINT : null },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'profile_unavailable', message: 'Your profile is temporarily unavailable.' } },
        { status: 503 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    return profileResponse(profile, user.id);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: { code: 'invalid_body', message: 'Provide profile fields to update.' } }, { status: 400 });
    }

    // Whitelist allowed fields to prevent mass assignment vulnerabilities
    const allowedFields = [
      'full_name',
      'phone',
      'skills',
      'skill_ratings',
      'goals',
      'education_level',
      'field_of_study',
      'experience_level',
      'github_url',
      'portfolio_url',
      'linkedin_url',
      'projects',
      'preferred_role',
      'preferred_locations',
      'onboarding_complete',
    ];

    const sanitizedUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (Object.hasOwn(body, field)) {
        sanitizedUpdates[field] = body[field];
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...sanitizedUpdates,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'update_failed', message: error.message } },
        { status: 400 }
      );
    }

    return profileResponse(profile, user.id);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
