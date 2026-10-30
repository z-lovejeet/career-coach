import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server auth configuration missing' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create confirmed user immediately so they can log in without email verification blocking
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || '',
      },
    });

    if (createError) {
      // Check if user already exists
      if (
        createError.message.includes('already been registered') ||
        createError.message.includes('already exists')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email already exists. Please switch to Sign In.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
    }

    // Ensure candidate row exists in profiles table
    if (newUser?.user?.id) {
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        email,
        full_name: fullName || '',
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created and confirmed successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error during registration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
