import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLegacyGuestEmail } from '@/lib/supabase/legacy-guest';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, captchaToken } = await request.json().catch(() => null) ?? {};
    if (typeof email !== 'string' || email.length > 254 || !email.trim() || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Enter a valid email and a password of at least 8 characters.' }, { status: 400 });
    }

    const sent = () => NextResponse.json({
      success: true,
      requiresEmailConfirmation: true,
      message: 'Check your inbox for a confirmation link. If you already have an account, you can sign in.',
    });

    if (isLegacyGuestEmail(email)) return sent();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Registration is temporarily unavailable.' }, { status: 503 });
    }

    // A misconfigured provider must never silently confirm an unverified account.
    const settingsResponse = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/settings`, {
      headers: { apikey: supabaseKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const settings = settingsResponse.ok ? await settingsResponse.json() : null;
    if ((settings?.mailer_autoconfirm ?? settings?.autoconfirm) !== false) {
      return NextResponse.json({ success: false, error: 'Email confirmation is unavailable. Please try again later.' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: typeof fullName === 'string' ? fullName.trim().slice(0, 120) : '' },
        emailRedirectTo: new URL('/auth/callback', request.url).href,
        captchaToken: typeof captchaToken === 'string' ? captchaToken : undefined,
      },
    });

    if (data.session) {
      await supabase.auth.signOut({ scope: 'local' });
      return NextResponse.json({ success: false, error: 'Email confirmation is unavailable. Please try again later.' }, { status: 503 });
    }

    if (!error || ['user_already_exists', 'email_exists', 'identity_already_exists'].includes(error.code || '')) {
      return sent();
    }

    if (error.status === 429) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const message = error.code === 'captcha_failed'
      ? 'Please complete the verification and try again.'
      : error.code === 'weak_password' || error.code === 'email_address_invalid' || error.code === 'validation_failed'
        ? 'Check your email address and choose a stronger password.'
        : 'Registration is temporarily unavailable. Please try again.';
    return NextResponse.json({ success: false, error: message }, { status: error.status && error.status >= 500 ? 503 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Registration is temporarily unavailable.' }, { status: 503 });
  }
}
