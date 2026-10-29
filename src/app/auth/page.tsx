"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back to your career command center!");
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account initialized! Let's set up your dossier.");
        router.push("/onboarding");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F4F6F9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 subtle-grid pointer-events-none opacity-30" />
      <div className="fixed -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 p-0.5 bg-[#0E1017]">
              <Image src="/logo.png" alt="CareerAI" fill className="object-cover rounded-lg" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              CareerAI
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENCRYPTED AUTH GATEWAY</span>
          </div>
        </div>

        {/* Double-Bezel Card */}
        <div className="p-1.5 rounded-3xl bg-white/[0.04] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <div className="p-6 sm:p-8 rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16] border border-white/[0.06]">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {isLogin ? "Authenticate Session" : "Create Candidate Dossier"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {isLogin
                  ? "Access your preparation roadmap and active mentor logs"
                  : "Begin multi-agent placement calibration and mock interviews"}
              </p>
            </div>

            {/* Google Auth Button */}
            <Button
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white text-xs font-mono tracking-wide mb-5 flex items-center justify-center gap-2.5 rounded-xl transition-all"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Subtle Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
                <span className="bg-[#0C0E16] px-3 text-muted-foreground">or email key</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-mono text-slate-400">
                    Full Legal Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Alex Mercer"
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
                    placeholder="candidate@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-white/[0.02] border-white/10 rounded-xl text-sm focus:border-blue-500/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-mono text-slate-400">
                  Password
                </Label>
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

              <Button
                type="submit"
                className="w-full h-11 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs font-mono tracking-wider uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? "Sign In to Terminal" : "Register Candidate"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Toggle Login / Register */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-muted-foreground hover:text-white transition-colors font-mono"
              >
                {isLogin ? (
                  <>New candidate? <span className="text-blue-400 font-semibold underline underline-offset-4">Create an account</span></>
                ) : (
                  <>Already calibrated? <span className="text-blue-400 font-semibold underline underline-offset-4">Sign in</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Supabase RLS Protected
          </span>
          <span>•</span>
          <span>Dual AI Sandbox</span>
        </div>
      </div>
    </div>
  );
}
