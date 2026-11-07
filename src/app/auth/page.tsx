"use client";

import { Suspense, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/studio/brand";
import { SiteFooter } from "@/components/studio/site-footer";
import { openGuestWorkspace } from "@/components/studio/guest-action";
import { Turnstile } from "@/components/studio/turnstile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const modes = {
  login: {
    label: "Sign in",
    heading: "Welcome back",
    description: "Pick up your preparation where you left off.",
  },
  register: {
    label: "Create account",
    heading: "Create an account",
    description: "Set up your own preparation workspace.",
  },
  guest: {
    label: "Guest",
    heading: "Try the workspace",
    description:
      "Explore a sample profile and practice plan in a guest session.",
  },
};

type Mode = keyof typeof modes;

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.2 3.6l6.86-6.86C35.9 2.38 30.48 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8 6.21C12.45 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.24 5.48-4.75 7.17l7.73 6C44.43 38 46.98 31.87 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.57A14.4 14.4 0 0 1 9.77 24c0-1.59.27-3.13.76-4.57l-8-6.21A24 24 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.21Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.92-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.19 2.31-6.26 0-11.55-4.22-13.44-9.93l-8 6.21C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

function AuthForm({
  mode,
  callbackError,
}: {
  mode: Mode;
  callbackError: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(callbackError);
  const [pending, setPending] = useState<"form" | "google" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const { heading, description } = modes[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending("form");
    try {
      if (mode === "guest") {
        await openGuestWorkspace(captchaToken || undefined);
        return;
      }
      const response = await fetch(
        mode === "register" ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            captchaToken,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "We couldn’t complete your request. Try again.",
        );
      }
      if (mode === "register") {
        setPassword("");
        setConfirmed(true);
        setPending(null);
        return;
      }
      const destination =
        result.redirect === "/onboarding" ? "/onboarding" : "/dashboard";
      window.location.assign(new URL(destination, window.location.origin));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t complete your request. Try again.",
      );
      setCaptchaToken("");
      setCaptchaAttempt((attempt) => attempt + 1);
      setPending(null);
    }
  }

  async function googleSignIn() {
    setError(null);
    setPending("google");
    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url)
        throw new Error(
          "Google sign-in is unavailable right now. You can continue with email.",
        );
      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in is unavailable right now.",
      );
      setPending(null);
    }
  }

  if (confirmed) {
    return (
      <section
        className="auth-form glass-panel space-y-4"
        aria-labelledby="auth-title"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
          <Mail size={22} aria-hidden />
        </div>
        <h1 id="auth-title" className="text-3xl font-extrabold">
          Check your inbox
        </h1>
        <p
          role="status"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          If this address can be registered, a confirmation email will arrive at{" "}
          <strong className="break-all text-foreground">{email}</strong>. Open
          the link in this browser to finish creating your account.
        </p>
        <Link href="/auth" className="studio-link -ml-3">
          <ArrowLeft size={16} aria-hidden /> Back to sign in
        </Link>
      </section>
    );
  }

  return (
    <section
      className="auth-form glass-panel space-y-5"
      aria-labelledby="auth-title"
    >
      <nav className="auth-tablist" aria-label="Account options">
        {Object.entries(modes).map(([key, value]) => (
          <Link
            key={key}
            href={key === "login" ? "/auth" : `/auth?mode=${key}`}
            aria-current={mode === key ? "page" : undefined}
            scroll={false}
          >
            {value.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1.5">
        <h1 id="auth-title" className="text-3xl font-extrabold">
          {heading}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form className="space-y-4" onSubmit={submit}>
        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="full-name">Name</Label>
            <Input
              id="full-name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
        )}
        {mode !== "guest" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                minLength={mode === "register" ? 8 : undefined}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters.
                </p>
              )}
            </div>
          </>
        )}
        {mode === "guest" && (
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check
                className="mt-0.5 shrink-0 text-primary"
                size={15}
                aria-hidden
              />{" "}
              Explore with sample data.
            </li>
            <li className="flex gap-2">
              <Check
                className="mt-0.5 shrink-0 text-primary"
                size={15}
                aria-hidden
              />{" "}
              Use this browser to return to your session.
            </li>
          </ul>
        )}
        {siteKey && (
          <Turnstile
            key={captchaAttempt}
            siteKey={siteKey}
            onToken={setCaptchaToken}
          />
        )}
        <button
          type="submit"
          className="studio-button w-full"
          disabled={pending !== null || Boolean(siteKey && !captchaToken)}
        >
          {pending === "form"
            ? "Please wait…"
            : mode === "guest"
              ? "Open guest workspace"
              : mode === "register"
                ? "Send confirmation email"
                : "Sign in"}
          <ArrowRight size={16} aria-hidden />
        </button>
      </form>

      {mode !== "guest" && (
        <button
          type="button"
          className="studio-link w-full border border-border bg-card/45"
          onClick={googleSignIn}
          disabled={pending !== null}
        >
          <GoogleMark />
          {pending === "google" ? "Connecting…" : "Continue with Google"}
        </button>
      )}
    </section>
  );
}

function AuthRouter() {
  const params = useSearchParams();
  const requestedMode = params.get("mode");
  const mode =
    requestedMode === "guest" || requestedMode === "register"
      ? requestedMode
      : "login";
  const error = params.get("error");
  return (
    <AuthForm
      key={mode + (error || "")}
      mode={mode}
      callbackError={error?.slice(0, 240) || null}
    />
  );
}

export default function AuthPage() {
  return (
    <>
      <header className="studio-frame studio-nav">
        <div className="studio-nav-inner glass-raised">
          <Brand />
          <Link href="/" className="studio-link">
            <ArrowLeft size={15} aria-hidden /> Back to home
          </Link>
        </div>
      </header>
      <main id="main-content" className="studio-frame auth-layout">
        <div className="auth-art glass-shell" data-liquid-surface>
          <div className="space-y-5">
            <p className="eyebrow flex items-center gap-2">
              <UserRound size={14} aria-hidden /> A space for your next chapter
            </p>
            <h2 className="max-w-[13ch] text-4xl font-semibold leading-[1.05] tracking-tight lg:text-5xl">
              A little clarity.
              <br />A steady way forward.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Bring your goals, experience, and questions. Shape a preparation
              routine that fits the role you want and the time you have.
            </p>
            <ul className="glass-inset grid gap-4 p-5 text-sm">
              {[
                [
                  "Know your starting point",
                  "Bring your skills and experience into one profile.",
                ],
                [
                  "Build a practical plan",
                  "Turn your goals into weekly milestones and practice.",
                ],
                [
                  "Get feedback as you go",
                  "Review your answers, refine your thinking, and return to what matters.",
                ],
              ].map(([title, description]) => (
                <li key={title} className="flex items-start gap-3">
                  <Check
                    size={15}
                    className="mt-1 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Suspense
          fallback={
            <div
              className="auth-form glass-panel min-h-80 animate-pulse"
              role="status"
            >
              <span className="sr-only">Loading account options</span>
            </div>
          }
        >
          <AuthRouter />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
