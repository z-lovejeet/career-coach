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
  Activity,
  Code2,
  Layers,
  ChevronRight,
  ArrowUpRight,
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
      window.location.href = data.redirect || "/dashboard";
    } catch (err: unknown) {
      console.error("Guest login error:", err);
      setGuestLoading(false);
      window.location.href = "/auth";
    }
  };

  const cta = isLoggedIn ? "/dashboard" : "/auth";
  const ctaText = isLoggedIn ? "Open Command Center" : "Calibrate Candidate Dossier";

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F6FB] selection:bg-blue-500/20 selection:text-blue-300">
      {/* ─── Architectural Grid & Subtle Radial Atmosphere ─── */}
      <div className="fixed inset-0 subtle-grid pointer-events-none opacity-25 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent)] pointer-events-none z-0" />

      {/* ─── Fixed Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#08090C]/85 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/[0.12] p-0.5 bg-[#0D0F17] shadow-sm flex items-center justify-center">
              <Image src="/logo.png" alt="CareerAI Logo" fill className="object-cover rounded-md" priority />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                CareerAI
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-white/[0.06] text-[#8A96AA] border border-white/[0.06]">
                v2.4
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-wider uppercase text-[#8A96AA]">
            <a href="#cockpit" className="hover:text-white transition-colors">Live Cockpit</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Agent Syndicate</a>
            <a href="#protocol" className="hover:text-white transition-colors">Protocol</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="h-8.5 px-4 rounded-lg bg-primary hover:bg-blue-500 text-white font-medium text-xs tracking-wide transition-all shadow-[0_2px_10px_rgba(59,130,246,0.3)]">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <button
                  onClick={handleGuestLogin}
                  disabled={guestLoading}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-mono text-xs transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{guestLoading ? "Connecting..." : "Guest Access (1-Click)"}</span>
                </button>
                <Link href="/auth">
                  <Button variant="ghost" className="h-8.5 px-3 text-xs font-mono text-[#8A96AA] hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="h-8.5 px-3.5 rounded-lg bg-white hover:bg-slate-200 text-black font-semibold text-xs tracking-wide transition-all shadow-sm">
                    Get Started <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Telemetry Badge */}
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0E111A] border border-white/[0.08] mb-6 shadow-sm">
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

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.08] text-white">
                Autonomous placement intelligence for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
                  elite software engineers.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-sm sm:text-base md:text-lg text-[#8A96AA] max-w-2xl leading-relaxed font-normal">
                Continuous multi-agent reasoning that decodes your code and resume, conducts rigorous Socratic mock rounds, isolates algorithmic blindspots, and calibrates your preparation until offer day.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <Link href={cta}>
                  <Button className="h-11 px-6 rounded-lg bg-primary hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(59,130,246,0.3)] transition-all">
                    <span>{ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                {!isLoggedIn && (
                  <button
                    onClick={handleGuestLogin}
                    disabled={guestLoading}
                    className="h-11 px-5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 font-mono text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {guestLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        <span>Calibrating...</span>
                      </span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Instant Guest Mode</span>
                      </>
                    )}
                  </button>
                )}

                <a href="#cockpit">
                  <Button
                    variant="outline"
                    className="h-11 px-4.5 rounded-lg border-white/[0.1] hover:border-white/[0.2] bg-[#0E111A] text-xs font-mono tracking-wider uppercase text-[#8A96AA] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Live Cockpit</span>
                  </Button>
                </a>
              </div>

              {/* Hiring Standards Verification */}
              <div className="mt-10 pt-6 border-t border-white/[0.07] w-full">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#64748B] mb-3">
                  Calibrated to rubrics from Tier-1 product engineering teams
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[#8A96AA]">
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

            {/* Right Interactive Cockpit */}
            <div id="cockpit" className="lg:col-span-5 w-full">
              <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
                
                {/* Terminal Header Bar */}
                <div className="px-4 py-3 bg-[#0A0C13] border-b border-white/[0.07] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-[11px] text-[#8A96AA] truncate">
                      career-agent.daemon • pid 94102
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[10px] text-emerald-400 font-semibold">STREAMING</span>
                  </div>
                </div>

                {/* Cockpit Segment Tabs */}
                <div className="p-1.5 bg-[#090B12] border-b border-white/[0.06] flex items-center gap-1">
                  <button
                    onClick={() => setActiveCockpitTab("mentor")}
                    className={`flex-1 py-1.5 px-2 rounded-md font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeCockpitTab === "mentor"
                        ? "bg-blue-600/15 text-blue-300 border border-blue-500/25 font-medium"
                        : "text-[#8A96AA] hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>01 Socratic</span>
                  </button>

                  <button
                    onClick={() => setActiveCockpitTab("interview")}
                    className={`flex-1 py-1.5 px-2 rounded-md font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeCockpitTab === "interview"
                        ? "bg-emerald-600/15 text-emerald-300 border border-emerald-500/25 font-medium"
                        : "text-[#8A96AA] hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span>02 Mock Rubric</span>
                  </button>

                  <button
                    onClick={() => setActiveCockpitTab("radar")}
                    className={`flex-1 py-1.5 px-2 rounded-md font-mono text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeCockpitTab === "radar"
                        ? "bg-purple-600/15 text-purple-300 border border-purple-500/25 font-medium"
                        : "text-[#8A96AA] hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <Building2 className="w-3 h-3 text-purple-400" />
                    <span>03 Match Radar</span>
                  </button>
                </div>

                {/* Cockpit Content */}
                <div className="p-5 min-h-[310px] flex flex-col justify-between bg-[#0B0D16]">
                  
                  {activeCockpitTab === "mentor" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#8A96AA] pb-2 border-b border-white/[0.05]">
                        <span className="text-blue-400 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" /> GROQ • OPENAI/GPT-OSS-120B
                        </span>
                        <span className="text-emerald-400 font-bold tabular-nums">280 tok/sec</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0E111C] border border-white/[0.06] text-xs text-slate-200 font-mono">
                        <span className="text-blue-400 mr-2">candidate&gt;</span>
                        &quot;Should I use Dijkstra or 0-1 BFS for a grid with weighted edge costs 0 and 1?&quot;
                      </div>

                      <div className="p-3 rounded-lg bg-[#0F1322] border border-blue-500/20 text-xs font-mono text-slate-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" /> Mentor Evaluation
                        </div>
                        <p className="leading-relaxed text-[#D0D6E2]">
                          Use <strong className="text-white">0-1 BFS via a Deque</strong>. Time complexity drops from <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">O(E log V)</code> to pure <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">O(V + E)</code> because edges are processed in strictly non-decreasing distance order without min-heap overhead.
                        </p>
                        <div className="p-2 rounded bg-black/50 text-[11px] text-slate-300 border border-white/[0.04]">
                          <code>q.push_front(v) if w == 0 else q.push_back(v)</code>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCockpitTab === "interview" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#8A96AA] pb-2 border-b border-white/[0.05]">
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5" /> TECHNICAL ROUND SIMULATION
                        </span>
                        <span className="text-white font-bold">L4 Distributed Systems</span>
                      </div>

                      <div className="p-3 rounded-lg bg-[#0E1320] border border-emerald-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white tabular-nums">Score: 92 / 100</span>
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
                          <div className="flex items-center gap-1.5 text-amber-300">
                            <span>⚠</span> Tip: Explicitly handle duplicate in-flight requests with 409 Conflict
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0E111C] border border-white/[0.04] text-[11px] font-mono flex items-center justify-between text-[#8A96AA]">
                        <span>Confidence Metric</span>
                        <span className="text-emerald-400 font-semibold tabular-nums">96.4% Nuance Recognition</span>
                      </div>
                    </div>
                  )}

                  {activeCockpitTab === "radar" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#8A96AA] pb-2 border-b border-white/[0.05]">
                        <span className="text-purple-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> PLACEMENT MATCH MATRIX
                        </span>
                        <span className="text-blue-400 font-mono">TARGET RADAR</span>
                      </div>

                      <div className="space-y-2 font-mono">
                        <div className="p-2.5 rounded-lg bg-[#0E111C] border border-white/[0.06] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-white">Stripe • Core Infrastructure</p>
                            <p className="text-[10px] text-[#8A96AA]">Match: Distributed Systems, Kafka, Go</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">94%</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0E111C] border border-white/[0.06] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-white">Google • L3/L4 Software Engineer</p>
                            <p className="text-[10px] text-[#8A96AA]">Match: Advanced Graph DSA, C++</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">88%</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0E111C] border border-white/[0.06] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-white">Uber • Platform Engineering</p>
                            <p className="text-[10px] text-amber-300">Missing: Microservices Resiliency (Sprint Active)</p>
                          </div>
                          <span className="text-sm font-bold text-amber-400 tabular-nums">76%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cockpit Footer */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                    <span>Engine: Gemini 3.8 + Groq 120B</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" /> Continuous Telemetry
                    </span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Bento Grid: Multi-Agent Architecture ─── */}
      <section id="architecture" className="py-20 px-6 border-t border-white/[0.07] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono text-[11px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Autonomous Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-4 mb-3">
              Not a chatbot. A full-scale placement syndicate.
            </h2>
            <p className="text-[#8A96AA] text-sm leading-relaxed">
              Every workflow is decoupled into specialized agent runtimes that evaluate, adjust, and prepare you like a team of dedicated FAANG mentors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 flex flex-col justify-between hover:border-blue-500/30 transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Deep Multi-modal Parsing</h3>
                <p className="text-xs text-[#8A96AA] leading-relaxed">
                  Upload any PDF resume. Gemini 3.8 Flash extracts concrete technical proficiencies, parses project complexity, and assigns confidence ratings across 100+ taxonomy categories.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8A96AA]">
                <span>Gemini 3.8 Flash</span>
                <span className="text-blue-400 font-semibold">Zero Slop</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Technical Interview Simulation</h3>
                <p className="text-xs text-[#8A96AA] leading-relaxed">
                  Powered by Groq 120B. Simulates algorithmic coding, system design, and behavioral pressure tests with sub-second feedback, grading syntax, time complexity, and edge cases.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8A96AA]">
                <span>Groq • GPT-OSS 120B</span>
                <span className="text-emerald-400 font-semibold tabular-nums">Sub-second</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Company Fit & Live Jobs</h3>
                <p className="text-xs text-[#8A96AA] leading-relaxed">
                  Computes compatibility scores for top tech tiers (Google, Uber, Razorpay, Swiggy) and cross-references live LinkedIn postings to show you verified jobs matching your exact qualifications.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8A96AA]">
                <span>Apify LinkedIn API</span>
                <span className="text-indigo-400 font-semibold">Live Scraped</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Agent Pipeline Protocol Table ─── */}
      <section id="pipeline" className="py-20 px-6 bg-[#07080D] border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Agent Specification
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-3">
                Decoupled AI Pipeline Matrix
              </h2>
            </div>
            <p className="text-xs text-[#8A96AA] max-w-sm mt-3 md:mt-0 font-mono">
              Engineered with resilience: Gemini 3.8 Flash automatically routes to Gemini 3.5 Flash Lite upon reaching 17 RPD or demand spikes.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] overflow-hidden divide-y divide-white/[0.06]">
            {autonomousAgents.map((agent, i) => (
              <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5">
                  <span className="font-mono text-xs text-[#64748B] w-6 tabular-nums">0{i + 1}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
                    <p className="text-xs text-[#8A96AA] mt-0.5">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-[#131624] border border-white/[0.08] text-slate-300">
                    {agent.engine}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Protocol Steps ─── */}
      <section id="protocol" className="py-20 px-6 border-t border-white/[0.07]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
              The 4-Stage Candidate Protocol
            </h2>
            <p className="text-[#8A96AA] text-sm">
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
              <div key={i} className="p-5 rounded-xl bg-[#0E111A] border border-white/[0.08] relative">
                <span className="font-mono text-3xl font-bold text-white/20 mb-3 block tabular-nums">{st.step}</span>
                <h3 className="text-sm font-semibold text-white mb-1.5">{st.title}</h3>
                <p className="text-xs text-[#8A96AA] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 px-6 border-t border-white/[0.07]">
        <div className="max-w-4xl mx-auto text-center p-10 sm:p-14 rounded-2xl bg-[#0E111A] border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          <span className="font-mono text-xs uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Immediate Access
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mt-5 mb-4">
            Begin your calibration cycle now.
          </h2>
          <p className="text-[#8A96AA] text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            No credit card. Powered by high-speed Groq 120B reasoning and Gemini multi-modal intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={cta}>
              <Button className="h-11 px-7 rounded-lg bg-white hover:bg-slate-200 text-black font-semibold text-sm shadow-sm transition-all">
                {ctaText} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {!isLoggedIn && (
              <button
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="h-11 px-6 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-mono text-xs transition-colors cursor-pointer"
              >
                {guestLoading ? "Connecting..." : "Explore as Guest Candidate"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-white/[0.06] bg-[#07080C] text-xs font-mono text-[#8A96AA]">
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
