import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLegacyGuestEmail } from '@/lib/supabase/legacy-guest';

const destinations = new Set(['/dashboard', '/onboarding', '/tasks', '/companies', '/interview', '/chat', '/progress', '/profile', '/roadmap']);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const failure = () => NextResponse.redirect(new URL('/auth?error=Sign-in+link+invalid+or+expired.+Please+try+again.', origin));

  if (!code || searchParams.has('error')) return failure();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const user = data.user;
  if (error || !user) return failure();
  if (isLegacyGuestEmail(user.email)) {
    await supabase.auth.signOut({ scope: 'local' });
    return failure();
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) return failure();

  if (!profile) {
    const { error: insertError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      onboarding_complete: false,
    }, { onConflict: 'id', ignoreDuplicates: true });
    if (insertError) return failure();
  }

  const destination = !profile?.onboarding_complete
    ? '/onboarding'
    : next && destinations.has(next) ? next : '/dashboard';
  return NextResponse.redirect(new URL(destination, origin));
}
