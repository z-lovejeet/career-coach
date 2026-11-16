import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding", "/roadmap", "/practice", "/interview", "/mentor", "/profile"];

/** Refreshes the Supabase session cookie and guards workspace routes. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // OAuth providers sometimes return to the site root with ?code=…
  if (path === "/" && request.nextUrl.searchParams.has("code")) {
    const target = new URL("/auth/callback", request.url);
    request.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));
    return NextResponse.redirect(target);
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

  let destination: string | null = null;
  if (isProtected && !signedIn) destination = "/login";
  if (path === "/login" && signedIn) destination = "/dashboard";
  if (!destination) return response;

  const redirect = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|mjs)$).*)"],
};
