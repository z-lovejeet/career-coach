import { createServerClient } from "@supabase/ssr";
import { isLegacyGuestEmail } from "@/lib/supabase/legacy-guest";
import { NextResponse, type NextRequest } from "next/server";

const workspaceRoutes = new Set([
  "dashboard", "onboarding", "tasks", "companies", "interview", "chat", "progress", "profile", "roadmap",
]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get("code");

  // If OAuth provider redirected to root with a code, forward directly to the callback handler
  if (code && path === "/") {
    const callbackUrl = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  if (path !== "/auth" && !workspaceRoutes.has(path.split("/")[1])) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request, headers });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  let destination: string | null = null;
  if (path === "/auth") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !isLegacyGuestEmail(user.email)) destination = "/dashboard";
  } else {
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub || isLegacyGuestEmail(data.claims.email)) destination = "/auth";
  }
  if (!destination) return response;

  const redirect = NextResponse.redirect(new URL(destination, request.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}
