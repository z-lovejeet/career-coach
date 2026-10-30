import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

  if (error) {
    console.error('OAuth redirect error from provider:', error, error_description);
    const errMessage = encodeURIComponent(error_description || error || 'OAuth authentication failed');
    return NextResponse.redirect(`${origin}/auth?error=${errMessage}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();

        // If user profile doesn't exist yet, insert baseline profile
        if (!profile) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              '',
            onboarding_complete: false,
          });
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        if (!profile.onboarding_complete) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Session exchange error:', exchangeError);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  // Auth error — redirect to auth page with notification
  return NextResponse.redirect(`${origin}/auth?error=No+authentication+code+received`);
}
