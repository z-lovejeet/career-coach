"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Cpu,
  KeyRound,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

function AuthContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const supabase = createClient();

  useEffect(() => {
    if (oauthError) {
      const decoded = decodeURIComponent(oauthError);
      setFormError(`OAuth Error: ${decoded}`);
      toast.error(`Authentication notice: ${decoded}`);
    }
  }, [oauthError]);

  // 1-Click Guest Login Handler (100% Server-Side Session)
  const handleGuestLogin = async () => {
    setFormError(null);
    setGuestLoading(true);
    try {
      toast.info("Calibrating pre-seeded L4 Guest candidate dossier...");
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize guest session");
      }

      toast.success("Guest candidate authenticated! Launching Command Center...");
      // Server-side Route Handler set the session cookies on localhost!
      window.location.href = data.redirect || "/dashboard";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Guest authentication failed";
      setFormError(message);
      toast.error(message);
      setGuestLoading(false);
    }
  };

  // Google OAuth Handler with Graceful Fallback
  const handleGoogleAuth = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        if (
          error.message.includes("provider is not enabled") ||
          error.message.includes("Unsupported provider")
        ) {
          setGoogleModalOpen(true);
          setGoogleLoading(false);
          return;
        }
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      setFormError(message);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  // Email / Password Handler (Server-Side Session)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Direct Server Login (sets session cookies on localhost)
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Invalid credentials. If new, click 'Create Account' tab.");
        }

        toast.success("Identity verified! Entering Command Center...");
        window.location.href = data.redirect || "/dashboard";
      } else {
        // Direct Server Registration with Auto-Confirm
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Registration failed");
        }

        toast.success("Account initialized! Calibrating candidate dossier...");
        window.location.href = data.redirect || "/onboarding";
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setFormError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 p-0.5 bg-[#0C0E16] shadow-sm group-hover:border-blue-500/40 transition-colors">
            <Image src="/logo.png" alt="CareerAI" fill className="object-cover rounded-lg" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
            CareerAI
          </span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTONOMOUS ENGINE AUTH GATEWAY</span>
        </div>
      </div>

      {/* Global Form Error Alert if any */}
      {formError && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Notice</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5 font-mono">{formError}</p>
          </div>
        </div>
      )}

      {/* ─── HIGHLIGHT: 1-Click Instant Guest Access Card ─── */}
      <div className="mb-5 p-1 rounded-2xl bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-emerald-600/30 border border-white/10 shadow-[0_0_35px_rgba(59,130,246,0.15)]">
        <div className="p-4 rounded-[calc(1rem-0.25rem)] bg-[#0C0E18] flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-white tracking-wide">
                  1-Click Instant Guest Access
                </h2>
                <p className="text-[11px] text-slate-400">
                  Pre-calibrated L4 Engineer dossier with sample roadmap & tasks
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Zero Setup
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={guestLoading || loading || googleLoading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-semibold tracking-wider uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {guestLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching Guest Cockpit...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Explore as Guest Candidate</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="p-1.5 rounded-3xl bg-white/[0.04] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <div className="p-6 sm:p-7 rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16] border border-white/[0.06]">
          {/* Prominent Tab Switcher */}
          <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] flex items-center gap-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                isLogin
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header Description */}
          <div className="mb-5">
            <h1 className="text-base font-bold tracking-tight text-white">
              {isLogin ? "Authenticate Credentials" : "Create Candidate Dossier"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLogin
                ? "Access your calibrated roadmap & active mentor logs"
                : "Begin multi-agent placement evaluation & interview practice"}
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading || guestLoading}
            className="w-full h-11 border border-white/10 bg-white/[0.02] hover:bg-white/[0.07] text-white text-xs font-mono tracking-wide mb-5 flex items-center justify-center gap-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Redirecting to Google...</span>
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
              <span className="bg-[#0C0E16] px-3 text-muted-foreground">or email key</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-mono text-slate-400">
                  Candidate Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Alex Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 bg-white/[0.02] border-white/10 rounded-xl text-sm focus:border-blue-500/50"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-mono text-slate-400">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="engineer@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/[0.02] border-white/10 rounded-xl text-sm focus:border-blue-500/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-mono text-slate-400">
                  Password
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-white/[0.02] border-white/10 rounded-xl text-sm focus:border-blue-500/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || guestLoading || googleLoading}
              className="w-full h-11 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs font-mono tracking-wider uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? "Sign In to Command Center" : "Create Confirmed Dossier"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Security & Architecture Telemetry Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Supabase RLS Protected</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Groq GPT-OSS 120B & Gemini 3.8</span>
        </span>
      </div>

      {/* ─── Google OAuth Setup Guide Modal ─── */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0F121C] border border-white/15 shadow-2xl relative">
            <button
              onClick={() => setGoogleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-amber-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold tracking-tight text-white">
                Google OAuth Setup Notice
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Google Sign-in is not yet active in your Supabase project. To complete setup:
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-[11px] font-mono text-slate-300 space-y-2 mb-4">
              <p>1. Open Supabase Dashboard → Authentication → Providers → Google</p>
              <p>2. Enter your Google Client ID & Secret from Google Cloud Console</p>
              <p>3. Click &quot;Save&quot; in Supabase</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setGoogleModalOpen(false);
                  handleGuestLogin();
                }}
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Continue as Guest Instead (1-Click)</span>
              </button>

              <button
                onClick={() => setGoogleModalOpen(false)}
                className="w-full h-9 rounded-xl border border-white/10 hover:bg-white/[0.04] text-slate-400 hover:text-white text-xs font-mono transition-all"
              >
                Close & Use Email Sign-In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#07080C] text-[#F4F6F9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Architectural Ambience */}
      <div className="fixed inset-0 subtle-grid pointer-events-none opacity-30" />
      <div className="fixed -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-20 right-10 w-[400px] h-[300px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-3xl bg-[#0C0E16] border border-white/10 text-center font-mono text-xs text-slate-400">
            <span className="w-4 h-4 border-2 border-white/30 border-t-blue-500 rounded-full animate-spin inline-block mb-3" />
            <p>Loading Encrypted Gateway...</p>
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </div>
  );
}
