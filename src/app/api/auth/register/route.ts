import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

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

    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create confirmed user with Admin API (auto-confirmed = no email verification trap!)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName?.trim() || '',
      },
    });

    if (createError) {
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

    // 2. Ensure initial candidate profile exists in profiles table
    if (newUser?.user?.id) {
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        email: email.trim(),
        full_name: fullName?.trim() || '',
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 3. Immediately sign in on the server to issue session cookies directly
    const serverSupabase = await createServerSupabase();
    const { data: authData, error: signInError } = await serverSupabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      console.warn('Auto sign-in notice:', signInError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created and authenticated successfully',
      redirect: '/onboarding',
      user: {
        id: authData?.user?.id || newUser.user.id,
        email: authData?.user?.email || email,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error during registration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
