import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isLegacyGuestEmail } from '@/lib/supabase/legacy-guest';

const destinations = new Set([
  '/dashboard',
  '/onboarding',
  '/tasks',
  '/companies',
  '/interview',
  '/chat',
  '/progress',
  '/profile',
  '/roadmap',
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  // Determine origin dynamically from the incoming request headers (Vercel/proxy aware)
  let origin = requestUrl.origin;
  if (forwardedHost) {
    origin = `${forwardedProto}://${forwardedHost}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    origin = process.env.NEXT_PUBLIC_APP_URL;
  }

  const searchParams = requestUrl.searchParams;

  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Handle explicit OAuth errors from the provider
  if (searchParams.has('error')) {
    const errorMsg =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      'Authentication was cancelled or failed.';
    console.error('[auth/callback] Provider error:', errorMsg);
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(errorMsg)}`, origin));
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth?error=Missing+authentication+code.+Please+try+again.', origin)
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.user) {
      console.error('[auth/callback] Code exchange failed:', error?.message);
      return NextResponse.redirect(
        new URL(
          `/auth?error=${encodeURIComponent(error?.message || 'Sign-in link invalid or expired. Please try again.')}`,
          origin
        )
      );
    }

    const user = data.user;

    // Reject legacy guest email if somehow authenticated via callback
    if (isLegacyGuestEmail(user.email)) {
      await supabase.auth.signOut({ scope: 'local' });
      return NextResponse.redirect(
        new URL('/auth?error=Session+invalidated.+Please+sign+in+again.', origin)
      );
    }

    // Initialize admin client to ensure profile provisioning bypasses any RLS race conditions
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const admin = url && serviceKey
      ? createServiceClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    const db = admin ?? supabase;

    // Check or provision user profile
    const { data: profile } = await db
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Candidate';

      await db.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          onboarding_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    const destination = !profile?.onboarding_complete
      ? '/onboarding'
      : next && destinations.has(next)
        ? next
        : '/dashboard';

    return NextResponse.redirect(new URL(destination, origin));
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    return NextResponse.redirect(
      new URL('/auth?error=Authentication+processing+failed.+Please+try+again.', origin)
    );
  }
}
