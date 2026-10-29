"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const autonomousAgents = [
  { name: "Profile Intelligence", engine: "Gemini 3.8 Flash", role: "Resume parsing & multi-modal skill gap extraction" },
  { name: "Mentor Reasoning", engine: "Groq • GPT-OSS 120B", role: "Real-time Socratic doubt clearing & DSA coaching" },
  { name: "Adaptive Planner", engine: "Groq • GPT-OSS 120B", role: "Dynamic weekly curriculum calibrated to gaps" },
  { name: "Technical Interviewer", engine: "Groq • GPT-OSS 120B", role: "Multi-round mock interviews with nuance grading" },
  { name: "Company Matchmaker", engine: "Gemini 3.8 Flash", role: "Deterministic fit scoring & target company matching" },
  { name: "Live Market Radar", engine: "Apify / LinkedIn", role: "Real-time job postings synchronized with your skill level" },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const cta = isLoggedIn ? "/dashboard" : "/auth";
  const ctaText = isLoggedIn ? "Launch Command Center" : "Initialize Career Engine";

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F4F6F9] selection:bg-blue-500/20 selection:text-blue-300">
      {/* ─── Top Ambient Light Grid ─── */}
      <div className="fixed inset-0 subtle-grid pointer-events-none opacity-40" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-[140px] pointer-events-none" />

      {/* ─── Navigation ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#08090D]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 p-0.5 bg-[#0E1017]">
              <Image src="/logo.png" alt="CareerAI Logo" fill className="object-cover rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                CareerAI
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v2.4
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Agent Pipeline</a>
            <a href="#matrix" className="hover:text-white transition-colors">Placement Matrix</a>
            <a href="#workflow" className="hover:text-white transition-colors">Protocol</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="h-9 px-3.5 text-xs text-muted-foreground hover:text-white hover:bg-white/[0.04]">
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

      {/* ─── Hero Section ─── */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Eyebrow Badge */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-300 tracking-wider uppercase">
                Dual AI Engine: Groq 120B + Gemini 3.8
              </span>
            </motion.div>
          </div>

          {/* Heading */}
          <div className="text-center max-w-4xl mx-auto mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.06] text-white"
            >
              Precision Placement Intelligence for{" "}
              <span className="gradient-accent-text">Elite Software Roles.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-normal"
            >
              Seven orchestrated AI agents decode your resume, simulate rigorous technical rounds, isolate critical skill gaps, and calibrate your daily prep until your offer is secured.
            </motion.p>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href={cta} className="w-full sm:w-auto">
              <div className="p-0.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_35px_rgba(59,130,246,0.35)] hover:shadow-[0_0_45px_rgba(59,130,246,0.5)] transition-all">
                <button className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#08090D] hover:bg-[#0D101A] text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors">
                  <span>{ctaText}</span>
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </Link>

            <a href="#features" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 px-6 rounded-full border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-xs font-mono tracking-wider uppercase text-slate-300"
              >
                Inspect Telemetry
              </Button>
            </a>
          </motion.div>

          {/* ─── Hero Machine Mockup (Double-Bezel Architecture) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="p-1.5 rounded-2xl md:rounded-3xl bg-white/[0.05] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04]"
          >
            <div className="rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16] border border-white/[0.08] overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="px-5 py-3.5 bg-[#090A10] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                    career-coach.orchestrator • pid 88412
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    AGENTS READY
                  </span>
                </div>
              </div>

              {/* Terminal Body Grid */}
              <div className="p-6 md:p-8 grid md:grid-cols-12 gap-6 bg-[#0B0D14]">
                {/* Left: Candidate Readiness Score */}
                <div className="md:col-span-4 p-5 rounded-xl bg-[#0F121C] border border-white/[0.06] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Readiness Index</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">CALCULATED</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold font-mono tracking-tight text-white">84</span>
                      <span className="text-sm font-mono text-muted-foreground">/ 100</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Calibrated against Tier-1 Product Engineering standards (Google L3 / Atlassian P3).
                    </p>
                  </div>

                  <div className="space-y-2 mt-6">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">DSA & Algorithms</span>
                      <span className="text-emerald-400 font-semibold">92%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono pt-1">
                      <span className="text-slate-400">System Design</span>
                      <span className="text-amber-400 font-semibold">68%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[68%]" />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono pt-1">
                      <span className="text-slate-400">Production React / Node</span>
                      <span className="text-blue-400 font-semibold">89%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[89%]" />
                    </div>
                  </div>
                </div>

                {/* Right: Live Agent Action Stream */}
                <div className="md:col-span-8 p-5 rounded-xl bg-[#0F121C] border border-white/[0.06] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      Live Autonomous Pipeline Activity
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">POLL: 50ms</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">›</span>
                        <span className="text-slate-300">Resume parsed:</span>
                        <span className="text-white font-semibold">Distributed Caching, Redis, Kafka</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">MATCHED</span>
                    </div>

                    <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400">›</span>
                        <span className="text-slate-300">Interview Agent:</span>
                        <span className="text-white">Generated DP question (Coin Change variant)</span>
                      </div>
                      <span className="text-[10px] text-blue-400">GROQ 120B</span>
                    </div>

                    <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400">›</span>
                        <span className="text-slate-300">Alert Triggered:</span>
                        <span className="text-amber-300">Target company &quot;Stripe&quot; demands gRPC fluency</span>
                      </div>
                      <span className="text-[10px] text-amber-400">GAP DETECTED</span>
                    </div>

                    <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">›</span>
                        <span className="text-slate-300">Scheduler:</span>
                        <span className="text-white">Week 3 task plan auto-injected 2 gRPC labs</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">ADAPTED</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Engine: Groq LLM + Gemini 3.8 Multi-modal</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Fallback active (3.5 Flash Lite ready)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Multi-Agent Architecture (Bento Grid) ─── */}
      <section id="features" className="py-24 px-6 border-t border-white/[0.08] relative">
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
      <section id="workflow" className="py-24 px-6 border-t border-white/[0.08]">
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
