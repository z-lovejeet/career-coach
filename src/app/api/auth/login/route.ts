import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLegacyGuestEmail } from '@/lib/supabase/legacy-guest';

export async function POST(request: Request) {
  try {
    const { email, password, captchaToken } = await request.json().catch(() => null) ?? {};

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const invalid = () => NextResponse.json({ success: false, error: 'Email or password is incorrect.' }, { status: 401 });
    if (isLegacyGuestEmail(email)) return invalid();

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: { captchaToken: typeof captchaToken === 'string' ? captchaToken : undefined },
    });

    if (error?.code === 'email_not_confirmed') {
      return NextResponse.json({ success: false, error: 'Confirm your email before signing in.' }, { status: 403 });
    }
    if (error?.code === 'captcha_failed') {
      return NextResponse.json({ success: false, error: 'Please complete the verification and try again.' }, { status: 400 });
    }
    if (error?.status === 429) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }
    if (error || !data.user) return invalid();
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut({ scope: 'local' });
      return NextResponse.json({ success: false, error: 'Confirm your email before signing in.' }, { status: 403 });
    }

    const { data: profile } = await supabase.from('profiles').select('onboarding_complete').eq('id', data.user.id).maybeSingle();
    return NextResponse.json({
      success: true,
      redirect: profile?.onboarding_complete ? '/dashboard' : '/onboarding',
      user: { id: data.user.id, email: data.user.email },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
