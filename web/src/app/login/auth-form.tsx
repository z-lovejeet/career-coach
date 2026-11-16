"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button, Field, Input, Segmented } from "@/components/ui/primitives";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.4-.2-2.1H12v4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-7.9Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1a6.4 6.4 0 0 1-6-4.4H2.3v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M6 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.3a11 11 0 0 0 0 9.9L6 14.2Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.3 7.1L6 9.9a6.4 6.4 0 0 1 6-4.5Z" />
    </svg>
  );
}

export function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("form");
    const supabase = supabaseBrowser();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(error.message === "Email not confirmed" ? "Please confirm your email first — check your inbox." : "That email and password don't match.");
        router.replace("/dashboard");
        router.refresh();
      } else {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw new Error(error.message);
        if (data.session) {
          router.replace("/onboarding");
          router.refresh();
        } else {
          setSent(true);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    setError(null);
    setBusy("google");
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError("Google sign-in is unavailable right now.");
      setBusy(null);
    }
  }

  if (sent) {
    return (
      <div className="animate-rise text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><MailCheck className="size-5" /></div>
        <h1 className="display text-3xl text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">We sent a confirmation link to <span className="text-ink">{email}</span>. Open it to finish creating your account.</p>
        <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("signin"); }}>Back to sign in</Button>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <h1 className="display text-[34px] leading-tight text-ink">{mode === "signin" ? "Welcome back" : "Start your plan"}</h1>
      <p className="mt-1.5 text-sm text-muted">{mode === "signin" ? "Sign in to continue where you left off." : "Create an account — it takes under a minute."}</p>

      <Segmented
        className="mt-7 w-full [&>button]:flex-1"
        value={mode}
        onChange={(m) => { setMode(m); setError(null); }}
        options={[{ value: "signin", label: "Sign in" }, { value: "signup", label: "Create account" }]}
      />

      <Button type="button" variant="outline" size="lg" className="mt-6 w-full" onClick={google} loading={busy === "google"} disabled={!!busy}>
        {busy !== "google" && <GoogleIcon />} Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <Field label="Full name" htmlFor="name">
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        )}
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
          <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "signup" ? 8 : undefined} />
        </Field>
        {error && <p role="alert" className="rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy === "form"} disabled={!!busy}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted lg:hidden">
        Curious first? <Link href="/samples" className="text-accent underline underline-offset-4">See sample roadmaps</Link>
      </p>
    </div>
  );
}
