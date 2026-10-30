"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Brain,
  Building2,
  ArrowRight,
  Mic,
  LayoutDashboard,
  Cpu,
  Check,
  Sparkles,
  Terminal,
  ShieldCheck,
  Zap,
  Flame,
  Star,
  Activity,
  Code2,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const autonomousAgents = [
  { name: "Profile Intelligence", engine: "Gemini 3.8 Flash", role: "Multi-modal resume parsing & granular skill matrix taxonomy extraction" },
  { name: "Mentor Reasoning", engine: "Groq • GPT-OSS 120B", role: "Real-time Socratic architectural debate & algorithmic coaching" },
  { name: "Adaptive Planner", engine: "Groq • GPT-OSS 120B", role: "Dynamic weekly sprint curriculum calibrated to identified candidate gaps" },
  { name: "Technical Interviewer", engine: "Groq • GPT-OSS 120B", role: "Multi-round simulated engineering rounds with nuanced rubric scoring" },
  { name: "Company Matchmaker", engine: "Gemini 3.8 Flash", role: "Deterministic fit index calculation against real Tier-1 hiring bars" },
  { name: "Live Market Radar", engine: "Apify / LinkedIn", role: "Real-time scrapers mapping verified hiring openings to candidate skillsets" },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activeCockpitTab, setActiveCockpitTab] = useState<"mentor" | "interview" | "radar">("mentor");
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize guest session");
      }
      const { email: guestEmail, password: guestPassword } = data.credentials;
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });
      if (signInError) throw signInError;
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error("Guest login error:", err);
      setGuestLoading(false);
      window.location.href = "/auth";
    }
  };

  const cta = isLoggedIn ? "/dashboard" : "/auth";
  const ctaText = isLoggedIn ? "Launch Command Center" : "Calibrate Candidate Dossier";

  return (
    <div className="min-h-screen bg-[#07080C] text-[#F4F6F9] selection:bg-blue-500/25 selection:text-blue-200">
      {/* ─── Ambient Architectural Lighting & Precision Grid ─── */}
      <div className="fixed inset-0 subtle-grid pointer-events-none opacity-30 z-0" />
      <div className="fixed -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-blue-600/18 via-indigo-600/6 to-transparent blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-60 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none z-0" />

      {/* ─── Floating Top Navigation Bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#07080C]/85 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10 p-0.5 bg-[#0C0E16] shadow-sm group-hover:border-blue-500/50 transition-colors">
              <Image src="/logo.png" alt="CareerAI Logo" fill className="object-cover rounded-lg" priority />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                CareerAI
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v2.4
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-slate-400">
            <a href="#cockpit" className="hover:text-white transition-colors">Live Cockpit</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Agent Syndicate</a>
            <a href="#protocol" className="hover:text-white transition-colors">Protocol</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <button
                  onClick={handleGuestLogin}
                  disabled={guestLoading}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-mono text-xs transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{guestLoading ? "Connecting..." : "Guest Access"}</span>
                </button>
                <Link href="/auth">
                  <Button variant="ghost" className="h-9 px-3.5 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/[0.04]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="h-9 px-4 rounded-full bg-white hover:bg-slate-200 text-black font-semibold text-xs tracking-wide transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                    Get Started <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (Bespoke Editorial Cockpit Split) ─── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Main Grid Split: Typography Left (7 cols) + Interactive Terminal Cockpit Right (5 cols) */}
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* ─── Left Column: High-Craft Narrative ─── */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Telemetry Status Beacon */}
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0F121E] border border-white/10 mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">
                  DUAL AI RUNTIME: GROQ 120B • GEMINI 3.8 FLASH
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LATENCY &lt;380MS
                </span>
              </div>

              {/* Grand Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.05] text-white">
                Autonomous placement intelligence for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
                  elite software engineers.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
                Continuous multi-agent reasoning that decodes your code & resume, conducts rigorous Socratic mock rounds, isolates algorithmic blindspots, and calibrates your preparation until offer day.
              </p>

              {/* Double-Nested "Button-in-Button" CTA Cluster */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <Link href={cta} className="group">
                  <div className="p-0.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_35px_rgba(59,130,246,0.35)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.55)] transition-all">
                    <div className="h-12 px-7 rounded-full bg-[#090B12] group-hover:bg-[#0D101C] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors">
                      <span className="tracking-wide font-semibold">{ctaText}</span>
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>

                {!isLoggedIn && (
                  <button
                    onClick={handleGuestLogin}
                    disabled={guestLoading}
                    className="group"
                  >
                    <div className="h-12 px-6 rounded-full border border-emerald-500/35 hover:border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                      {guestLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                          <span>Calibrating...</span>
                        </span>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Guest Login (1-Click)</span>
                        </>
                      )}
                    </div>
                  </button>
                )}

                <a href="#cockpit" className="group">
                  <Button
                    variant="outline"
                    className="h-12 px-5 rounded-full border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono tracking-wider uppercase text-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Live Cockpit</span>
                  </Button>
                </a>
              </div>

              {/* Social Proof / Engineering Standards Verification */}
              <div className="mt-10 pt-6 border-t border-white/[0.06] w-full">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                  Calibrated to rubrics from Tier-1 product engineering teams
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-blue-400" /> Google L3/L4
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-blue-400" /> Stripe Core
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-blue-400" /> Uber Infra
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-blue-400" /> Atlassian P3
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Check className="w-3.5 h-3.5 text-blue-400" /> Razorpay
                  </span>
                </div>
              </div>

            </div>

            {/* ─── Right Column: Interactive Hardware Telemetry Cockpit (Doppelrand) ─── */}
            <div id="cockpit" className="lg:col-span-5 w-full">
              <div className="p-1.5 sm:p-2 rounded-3xl bg-white/[0.04] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.05]">
                <div className="rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16] border border-white/[0.08] overflow-hidden flex flex-col">
                  
                  {/* Terminal Header Bar */}
                  <div className="px-4 py-3 bg-[#08090F] border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 font-mono text-[11px] text-slate-400 truncate">
                        career-agent.daemon • pid 94102
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-mono text-[10px] text-emerald-400">STREAMING</span>
                    </div>
                  </div>

                  {/* Interactive Cockpit Segment Selector */}
                  <div className="p-2 bg-[#0A0C14] border-b border-white/[0.06] flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveCockpitTab("mentor")}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                        activeCockpitTab === "mentor"
                          ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>01 Socratic</span>
                    </button>

                    <button
                      onClick={() => setActiveCockpitTab("interview")}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                        activeCockpitTab === "interview"
                          ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-medium"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <Mic className="w-3 h-3 text-emerald-400" />
                      <span>02 Mock Rubric</span>
                    </button>

                    <button
                      onClick={() => setActiveCockpitTab("radar")}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                        activeCockpitTab === "radar"
                          ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 font-medium"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <Building2 className="w-3 h-3 text-purple-400" />
                      <span>03 Match Radar</span>
                    </button>
                  </div>

                  {/* Active Cockpit Body Display */}
                  <div className="p-5 sm:p-6 min-h-[300px] flex flex-col justify-between bg-[#0B0D15]">
                    
                    {/* View 1: Socratic AI Mentor Reasoning */}
                    {activeCockpitTab === "mentor" && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-white/[0.04]">
                          <span className="text-blue-400 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5" /> GROQ • OPENAI/GPT-OSS-120B
                          </span>
                          <span className="text-emerald-400 font-bold">280 tok/sec</span>
                        </div>

                        {/* User Message */}
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-200 font-mono">
                          <span className="text-blue-400 mr-2">candidate&gt;</span>
                          &quot;Should I use Dijkstra or 0-1 BFS for a grid with weighted edge costs 0 and 1?&quot;
                        </div>

                        {/* Agent Socratic Response */}
                        <div className="p-3 rounded-xl bg-[#0F121E] border border-blue-500/20 text-xs font-mono text-slate-200 space-y-2">
                          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" /> Mentor Evaluation
                          </div>
                          <p className="leading-relaxed">
                            Use <strong>0-1 BFS via a Deque</strong>. Time complexity drops from <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">O(E log V)</code> to pure <code className="text-emerald-400 bg-black/40 px-1 py-0.5 rounded">O(V + E)</code> because edges are processed in strictly non-decreasing distance order without a min-heap overhead.
                          </p>
                          <div className="p-2 rounded bg-black/50 text-[11px] text-slate-300 border border-white/[0.04]">
                            <code>q.push_front(v) if w == 0 else q.push_back(v)</code>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View 2: Mock Interview Live Rubric */}
                    {activeCockpitTab === "interview" && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-white/[0.04]">
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5" /> TECHNICAL ROUND SIMULATION
                          </span>
                          <span className="text-white font-bold">L4 Distributed Systems</span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0F121E] border border-emerald-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-white">Score: 92 / 100</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              STRONG HIRE
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-mono">
                            Question: <em>&quot;Design idempotent transaction handling under network retries.&quot;</em>
                          </p>
                          <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <Check className="w-3 h-3" /> Covered: Unique Idempotency Keys + Redis Leases
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-400">
                              <span>⚠</span> Tip: Explicitly handle duplicate in-flight requests with 409 Conflict
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-[11px] font-mono flex items-center justify-between text-slate-400">
                          <span>Confidence Metric</span>
                          <span className="text-emerald-400 font-semibold">96.4% Nuance Recognition</span>
                        </div>
                      </div>
                    )}

                    {/* View 3: Company Match Radar */}
                    {activeCockpitTab === "radar" && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-white/[0.04]">
                          <span className="text-purple-400 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" /> PLACEMENT MATCH MATRIX
                          </span>
                          <span className="text-blue-400 font-mono">TARGET RADAR</span>
                        </div>

                        <div className="space-y-2 font-mono">
                          {/* Company 1 */}
                          <div className="p-2.5 rounded-xl bg-[#0F121E] border border-white/[0.06] flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">Stripe • Core Infrastructure</p>
                              <p className="text-[10px] text-slate-400">Match: Distributed Systems, Kafka, Go</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">94%</span>
                          </div>

                          {/* Company 2 */}
                          <div className="p-2.5 rounded-xl bg-[#0F121E] border border-white/[0.06] flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">Google • L3/L4 Software Engineer</p>
                              <p className="text-[10px] text-slate-400">Match: Advanced Graph DSA, C++</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">88%</span>
                          </div>

                          {/* Company 3 */}
                          <div className="p-2.5 rounded-xl bg-[#0F121E] border border-white/[0.06] flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">Uber • Platform Engineering</p>
                              <p className="text-[10px] text-amber-400">Missing: Microservices Resiliency (Sprint Active)</p>
                            </div>
                            <span className="text-sm font-bold text-amber-400">76%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live Telemetry Footer Bar */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Engine: Gemini 3.8 Multi-modal + Groq 120B</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" /> 0 AI Slop • Real Intelligence
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Multi-Agent Architecture (Bento Grid) ─── */}
      <section id="architecture" className="py-24 px-6 border-t border-white/[0.08] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono text-[11px] uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Autonomous Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-4 mb-3">
              Not a chatbot. A full-scale placement syndicate.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every workflow is decoupled into specialized agent runtimes that evaluate, adjust, and prepare you like a team of dedicated FAANG mentors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Resume & Profile Extraction */}
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 transition-all group">
              <div className="p-6 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Deep Multi-modal Parsing</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload any PDF resume. Gemini 3.8 Flash extracts concrete technical proficiencies, parses project complexity, and assigns confidence ratings across 100+ taxonomy categories.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Gemini 3.8 Flash</span>
                  <span className="text-blue-400">Zero Slop</span>
                </div>
              </div>
            </div>

            {/* Card 2: Technical Interview Terminal */}
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 transition-all group">
              <div className="p-6 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                    <Mic className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Technical Interview Simulation</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Powered by Groq 120B. Simulates algorithmic coding, system design, and behavioral pressure tests with sub-second feedback, grading syntax, time complexity, and edge cases.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Groq • GPT-OSS 120B</span>
                  <span className="text-emerald-400">Sub-second</span>
                </div>
              </div>
            </div>

            {/* Card 3: Deterministic Target Matching */}
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/30 transition-all group">
              <div className="p-6 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Company Fit & Live Jobs</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Computes compatibility scores for top tech tiers (Google, Uber, Razorpay, Swiggy) and cross-references live LinkedIn postings to show you verified jobs matching your exact qualifications.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Apify LinkedIn API</span>
                  <span className="text-indigo-400">Live Scraped</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Agent Pipeline Protocol Table ─── */}
      <section id="pipeline" className="py-24 px-6 bg-[#06070B] border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Agent Specification
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-3">
                Decoupled AI Pipeline Matrix
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mt-3 md:mt-0 font-mono">
              Designed with fail-safes: Gemini 3.8 Flash automatically routes to Gemini 3.5 Flash Lite upon reaching 17 RPD or during demand spikes.
            </p>
          </div>

          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
            <div className="rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] divide-y divide-white/[0.06]">
              {autonomousAgents.map((agent, i) => (
                <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono text-xs text-slate-500 w-6">0{i + 1}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#131622] border border-white/[0.08] text-slate-300">
                      {agent.engine}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Protocol Steps ─── */}
      <section id="protocol" className="py-24 px-6 border-t border-white/[0.08]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
              The 4-Stage Candidate Protocol
            </h2>
            <p className="text-muted-foreground text-sm">
              From cold resume to signed offer letter in a structured loop.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Dossier Ingestion", desc: "Upload resume and calibrate skill proficiencies from 1-10." },
              { step: "02", title: "Gap Diagnostics", desc: "AI identifies missing algorithms, architectural concepts, and tooling." },
              { step: "03", title: "Targeted Sprints", desc: "Weekly roadmap with daily DSA, theory, and implementation drills." },
              { step: "04", title: "Pressure Testing", desc: "Live mock interviews with scoring rubrics and company match apply links." },
            ].map((st, i) => (
              <div key={i} className="p-5 rounded-2xl bg-[#0C0E16] border border-white/[0.08] relative">
                <span className="font-mono text-3xl font-bold text-white/20 mb-3 block">{st.step}</span>
                <h3 className="text-sm font-semibold text-white mb-1.5">{st.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-b from-[#111422] to-[#0A0C14] border border-white/10 relative overflow-hidden shadow-[0_20px_90px_rgba(0,0,0,0.8)]">
          <div className="relative z-10">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Immediate Access
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mt-5 mb-4">
              Begin your calibration cycle now.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              No credit card. Powered by high-speed Groq 120B reasoning and Gemini multi-modal intelligence.
            </p>
            <div className="flex justify-center">
              <Link href={cta}>
                <Button className="h-12 px-8 rounded-full bg-white hover:bg-slate-200 text-black font-semibold text-sm shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all">
                  {ctaText} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-white/[0.06] bg-[#07080C] text-xs font-mono text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>CareerAI Placement Platform • Built with High-Craft Telemetry</span>
          </div>
          <div>
            <span>Groq 120B + Gemini 3.8 Flash • © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
