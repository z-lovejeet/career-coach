import { NextResponse } from "next/server";
import { createClient } from "@/server/db/supabase";

/** OAuth / email-confirmation landing. Exchanges the code for a session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host");
  const origin = host ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${host}` : url.origin;
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (providerError || !code) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(providerError ?? "Sign-in link is missing a code.")}`, origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("That sign-in link has expired. Please try again.")}`, origin));
  }
  return NextResponse.redirect(new URL("/dashboard", origin));
}
