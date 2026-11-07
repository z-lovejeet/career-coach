"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  FileCheck,
  Layers,
  Mic,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Volume2,
} from "lucide-react";
import { Brand } from "@/components/studio/brand";
import { SiteFooter } from "@/components/studio/site-footer";
import { openGuestWorkspace } from "@/components/studio/guest-action";

// Section B11: Tagline Reveal Component
// Words start muted (28% opacity) and transition individually to full color on scroll
function TaglineReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealProgress, setRevealProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealProgress(1);
      return;
    }

    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start reveal when top enters 75% of viewport, finish by 30%
      const startTrigger = windowHeight * 0.85;
      const endTrigger = windowHeight * 0.35;

      const progress = (startTrigger - rect.top) / (startTrigger - endTrigger);
      const clamped = Math.max(0, Math.min(1, progress));
      setRevealProgress(clamped);
    };

    const onScrollThrottled = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScrollThrottled, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", onScrollThrottled);
    };
  }, [prefersReducedMotion]);

  const words = [
    "Most", "engineers", "prepare", "with", "random", "practice", "problems", "and", "hope", "for", "the", "best.",
    "CareerAI", "turns", "your", "target", "role", "into", "an", "exact", "daily", "training", "plan",
    "with", "objective", "scoring,", "so", "you", "walk", "into", "every", "technical", "interview", "knowing", "you", "will", "pass."
  ];

  return (
    <section
      ref={containerRef}
      className="py-24 sm:py-32 px-4 border-y border-border/60 bg-white/40 backdrop-blur-sm"
      aria-label="Core philosophy"
    >
      <div className="max-w-[760px] mx-auto text-center">
        <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          The Engineering Standard
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-tight [text-wrap:balance]">
          {words.map((word, index) => {
            const wordThreshold = index / words.length;
            const isRevealed = prefersReducedMotion || revealProgress >= wordThreshold;

            return (
              <span
                key={index}
                className="inline-block mr-2.5 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: isRevealed ? 1 : 0.28,
                  color: isRevealed ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                {word}
              </span>
            );
          })}
        </h2>
      </div>
    </section>
  );
}

// Hero Interactive Cockpit Component
function HeroCockpit() {
  const [activeTab, setActiveTab] = useState<"interview" | "readiness" | "roadmap" | "daily">("interview");
  const [isAudioSimulating, setIsAudioSimulating] = useState(true);

  return (
    <div className="w-full rounded-3xl border border-white/80 bg-white/75 shadow-surface backdrop-blur-xl p-4 sm:p-6 transition-all duration-500">
      {/* Cockpit Window Bar */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/70">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs font-medium text-muted-foreground font-mono">
            session // live terminal v2.4
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Evaluation active
        </div>
      </div>

      {/* Segmented Cockpit Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 mb-5 rounded-xl bg-muted/60 border border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("interview")}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
            activeTab === "interview"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Interview simulation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("readiness")}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
            activeTab === "readiness"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Readiness score
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
            activeTab === "roadmap"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Milestone roadmap
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
            activeTab === "daily"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Daily practice
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[380px]">
        {activeTab === "interview" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* Prompt Card */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Technical Architecture Round // Staff Level
                </span>
                <span className="text-xs text-muted-foreground font-mono">Question 02 of 04</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug [text-wrap:pretty]">
                Design a distributed idempotency service for high volume multi region payment capture with sub 20 millisecond write SLA.
              </p>
            </div>

            {/* Audio Voice Simulation Bar */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAudioSimulating(!isAudioSimulating)}
                  className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                  aria-label={isAudioSimulating ? "Pause audio waveform" : "Play audio waveform"}
                >
                  {isAudioSimulating ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Candidate Voice Stream</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">03:48 / 05:00</span>
                  </div>
                  <p className="text-xs text-muted-foreground [text-wrap:pretty]">
                    Explaining DynamoDB conditional writes versus distributed locks
                  </p>
                </div>
              </div>

              {/* Dynamic waveform simulation */}
              <div className="flex items-center gap-1 h-6 px-2 self-center sm:self-auto">
                {[14, 24, 18, 30, 22, 12, 28, 34, 20, 16, 26, 32, 18, 24, 10, 22].map((height, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-primary transition-all duration-300 ${
                      isAudioSimulating ? "opacity-90" : "opacity-40"
                    }`}
                    style={{
                      height: isAudioSimulating ? `${height}px` : "6px",
                      animationDelay: `${i * 60}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Live Rubric Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-card border border-border/80">
                <span className="text-xs text-muted-foreground block mb-1">Architecture trade offs</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-foreground font-mono">4.8</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600">Strong hire</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/80">
                <span className="text-xs text-muted-foreground block mb-1">Failure handling</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-foreground font-mono">4.6</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600">Clear hire</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/80">
                <span className="text-xs text-muted-foreground block mb-1">Communication</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-foreground font-mono">4.9</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600">Exceptional</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/80">
                <span className="text-xs text-muted-foreground block mb-1">Edge cases</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-foreground font-mono">4.7</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600">Comprehensive</span>
              </div>
            </div>

            {/* Evaluation Highlight */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs leading-relaxed text-muted-foreground [text-wrap:pretty]">
              <strong className="text-foreground font-medium">Hiring committee rationale: </strong>
              Candidate proactively identified split brain failure risks in two phase commit protocols and selected single leader Raft groups with monotonic version fencing.
            </div>
          </motion.div>
        )}

        {activeTab === "readiness" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                  Calibrated Target Level
                </span>
                <h4 className="text-base font-semibold text-foreground">Staff Infrastructure Engineer</h4>
                <p className="text-xs text-muted-foreground [text-wrap:pretty]">
                  Based on target profiles across Tier 1 technology organizations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-semibold text-foreground font-mono">87.4%</span>
                  <span className="text-xs text-emerald-600 block font-medium">+14.2% this month</span>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-emerald-400 flex items-center justify-center font-mono text-xs font-semibold text-primary">
                  L6
                </div>
              </div>
            </div>

            {/* Skill categories */}
            <div className="space-y-3 p-4 rounded-xl bg-card border border-border/80">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-foreground">Distributed system design</span>
                  <span className="text-primary font-mono">92%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "92%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-foreground">Concurrency and state synchronization</span>
                  <span className="text-primary font-mono">88%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "88%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-foreground">System failure recovery and resilience</span>
                  <span className="text-primary font-mono">85%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-foreground">Behavioral leadership and conflict</span>
                  <span className="text-primary font-mono">84%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "84%" }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "roadmap" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-semibold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Week 1 to 4: Distributed primitives</h4>
                  <p className="text-xs text-muted-foreground">Consensus protocols, linearizability, and write ahead logs</p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-600">Completed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs font-mono">
                  05
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground">Week 5: High volume caching and consistency</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase">Current sprint</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cache stampede protection and lease based invalidation</p>
                </div>
              </div>
              <span className="text-xs font-medium text-primary font-mono">4 of 6 done</span>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-semibold text-xs font-mono">
                  06
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Week 6: Full live interview simulation</h4>
                  <p className="text-xs text-muted-foreground">45 minute mock onsite round with hiring manager rubric</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Upcoming</span>
            </div>
          </motion.div>
        )}

        {activeTab === "daily" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2.5"
          >
            <div className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Vocal Drill: Explain Raft leader election</h4>
                  <p className="text-xs text-muted-foreground">Explain term election, heartbeats, and candidate state transitions in 90 seconds</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-primary">Start drill</span>
                <span className="text-[10px] text-muted-foreground block font-mono">3 min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Index Optimization: Multi tenant compound keys</h4>
                  <p className="text-xs text-muted-foreground">Eliminate sequential table scans on partition key ranges</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-primary">Start drill</span>
                <span className="text-[10px] text-muted-foreground block font-mono">8 min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Behavioral STAR: Cross functional engineering deadlock</h4>
                  <p className="text-xs text-muted-foreground">Deliver a crisp four part answer showing technical mediation</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-primary">Start drill</span>
                <span className="text-[10px] text-muted-foreground block font-mono">6 min</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// 8 Frequently Asked Questions adhering to Section A2 / A7 / AEO
const faqs = [
  {
    q: "How does the AI evaluate my technical interview answers?",
    a: "Your answers are transcribed and analyzed against an objective 10 point hiring committee rubric covering architecture trade offs, operational failure modes, complexity analysis, and vocal clarity. You receive specific feedback explaining where your explanation met the bar and where deeper technical defense was required.",
  },
  {
    q: "Can I try the platform without creating an account or providing a credit card?",
    a: "Yes. You can launch our full guest sandbox workspace with a single click. No credit card, email, or registration is required to try simulated technical interviews, review mock rubrics, and inspect roadmap milestones.",
  },
  {
    q: "What engineering disciplines and seniority levels are supported?",
    a: "CareerAI supports senior, staff, and principal tracks across backend distributed systems, full stack engineering, site reliability, machine learning infrastructure, and technical engineering leadership.",
  },
  {
    q: "How does voice simulation work during practice rounds?",
    a: "You can speak naturally through your microphone just as you would in a live phone screen or virtual onsite. The system evaluates your reasoning out loud, measures pause cadences, and tests whether you clarify constraints before designing.",
  },
  {
    q: "Does CareerAI share or train on my resume or interview transcripts?",
    a: "No. Your resumes, voice recordings, and interview performance data are isolated to your secure session. We do not sell your personal data or use your interview content to train public models.",
  },
  {
    q: "How are the weekly milestone roadmaps generated?",
    a: "When you share your background and target engineering role, CareerAI audits the difference between your current experience and the target hiring standard, generating a sequenced week by week curriculum with focused daily drills.",
  },
  {
    q: "Can I use CareerAI for behavioral interviews as well as system design?",
    a: "Yes. The platform provides dedicated behavioral interview simulations calibrated to the STAR format, testing leadership under ambiguity, resolving cross team disagreements, and managing production incidents.",
  },
  {
    q: "How does this compare to traditional coding practice websites?",
    a: "Traditional platforms give you isolated algorithmic test cases with binary pass fail outputs. CareerAI simulates the full interactive interview conversation, evaluating how you communicate trade offs, defend architecture decisions, and respond to interviewer follow up inquiries.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleGuestWorkspace() {
    try {
      setIsGuestLoading(true);
      setGuestError(null);
      await openGuestWorkspace();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Guest workspace could not be opened.";
      setGuestError(msg);
      setIsGuestLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f3fb] text-[#171b36] selection:bg-[#c9cdf5] selection:text-[#24275b]">
      {/* Accessibility Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:shadow-lg focus:rounded-lg focus:outline-2 focus:outline-primary font-medium text-sm"
      >
        Skip to main content
      </a>

      {/* Floating Navigation Header (B7 rules) */}
      <header className="fixed top-4 inset-x-0 z-40 px-4 pointer-events-none">
        <nav
          className="max-w-[1020px] mx-auto pointer-events-auto rounded-2xl border border-white/80 bg-white/75 backdrop-blur-xl shadow-surface px-4 py-2.5 flex items-center justify-between transition-all duration-300"
          aria-label="Main Navigation"
        >
          <div className="flex items-center gap-6">
            <Brand href="/" />
            <div className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
              <a href="#cockpit" className="hover:text-foreground transition-colors duration-200">
                Cockpit
              </a>
              <a href="#benefits" className="hover:text-foreground transition-colors duration-200">
                Benefits
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors duration-200">
                How it works
              </a>
              <a href="#faq" className="hover:text-foreground transition-colors duration-200">
                FAQ
              </a>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth?mode=login"
              className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-xs"
            >
              Start free practice
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-5 h-4 relative flex flex-col justify-between">
              <span
                className={`w-full h-0.5 bg-foreground rounded transition-transform duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`w-full h-0.5 bg-foreground rounded transition-opacity duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-full h-0.5 bg-foreground rounded transition-transform duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </div>
          </button>
        </nav>
      </header>

      {/* Mobile Drawer Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-30 pt-20 px-6 bg-[#f1f3fb]/95 backdrop-blur-2xl flex flex-col justify-between pb-8 sm:hidden"
          >
            <div className="space-y-4 pt-6">
              {[
                ["Cockpit", "#cockpit"],
                ["Benefits", "#benefits"],
                ["How it works", "#how-it-works"],
                ["FAQ", "#faq"],
              ].map(([label, href], index) => (
                <a
                  key={index}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-2xl font-semibold text-foreground py-2 border-b border-border/40"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="space-y-3 pt-6">
              <Link
                href="/auth?mode=register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-center block text-sm"
              >
                Start free practice
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleGuestWorkspace();
                }}
                disabled={isGuestLoading}
                className="w-full py-3 rounded-xl bg-white border border-border text-foreground font-semibold text-center block text-sm"
              >
                Explore guest sandbox
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content">
        {/* HERO SECTION (Strictly per B5: left to right text gradient, max width 680px, meaningful breaks) */}
        <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 studio-frame">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 space-y-6">
              {/* Category tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Structured preparation for senior engineers</span>
              </div>

              {/* Heading 1: Left to right gradient on text, max width 680px */}
              <h1 className="max-w-[680px] text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight bg-gradient-to-r from-[#0f121d] via-[#242b45] to-[#596482] bg-clip-text text-transparent [text-wrap:balance]">
                Master senior technical interviews with structured practice.
              </h1>

              {/* Subhead: max width 680px, specific, no hyphens */}
              <p className="max-w-[680px] text-base sm:text-lg text-muted-foreground leading-relaxed [text-wrap:pretty]">
                Stop guessing what interviewers want. Get objective rubric evaluations, targeted milestone roadmaps, and realistic audio simulations tailored to your exact target engineering level.
              </p>

              {/* Primary Call to Action & Risk Reversal */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/auth?mode=register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-sm"
                >
                  Start free practice
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleGuestWorkspace}
                  disabled={isGuestLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/80 border border-border/80 text-foreground font-semibold text-sm hover:bg-white active:scale-[0.98] transition-all duration-200 shadow-xs"
                >
                  {isGuestLoading ? "Opening sandbox..." : "Explore guest sandbox"}
                </button>
              </div>

              {guestError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 [text-wrap:pretty]">
                  {guestError}
                </p>
              )}

              {/* Proof Signal beside claim (A2 / A4 requirement) */}
              <div className="pt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/60">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 text-white font-mono text-[10px] flex items-center justify-center border-2 border-white">
                    JD
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-mono text-[10px] flex items-center justify-center border-2 border-white">
                    SL
                  </div>
                  <div className="w-7 h-7 rounded-full bg-violet-500 text-white font-mono text-[10px] flex items-center justify-center border-2 border-white">
                    AK
                  </div>
                </div>
                <p className="[text-wrap:pretty]">
                  <strong className="text-foreground font-semibold">91.4% milestone completion rate</strong> across 1,420 simulated technical rounds
                </p>
              </div>
            </div>

            {/* Right Interactive Cockpit Column (Replacing empty JellySculpture) */}
            <div id="cockpit" className="lg:col-span-6">
              <HeroCockpit />
            </div>
          </div>
        </section>

        {/* Section B11: Mandatory Tagline Reveal */}
        <TaglineReveal />

        {/* Problem to Solution Comparison Section (A2 item 6) */}
        <section className="py-20 sm:py-28 px-4 studio-frame">
          <div className="max-w-[680px] mx-auto text-center mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
              The Preparation Shift
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight [text-wrap:balance]">
              Why traditional interview prep falls short
            </h2>
            <p className="text-base text-muted-foreground mt-3 [text-wrap:pretty]">
              Most engineers practice by solving isolated coding puzzles in silence, leaving architecture defense and verbal clarity untested until the real onsite round.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[980px] mx-auto">
            {/* The Old Way */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/50 border border-border/80 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-semibold text-sm">
                ✕
              </div>
              <h3 className="text-xl font-semibold text-foreground">The fragmented routine</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 mt-0.5">✕</span>
                  <span>Memorizing solutions without understanding the underlying trade offs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 mt-0.5">✕</span>
                  <span>Practicing in silence and stumbling when asked to explain decisions out loud</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 mt-0.5">✕</span>
                  <span>No feedback on whether your solution meets actual staff level hiring bars</span>
                </li>
              </ul>
            </div>

            {/* The CareerAI Way */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 border border-primary/30 shadow-surface space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-semibold text-sm">
                ✓
              </div>
              <h3 className="text-xl font-semibold text-foreground">The CareerAI standard</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Objective 10 point rubrics</strong> evaluating architecture, failure modes, and communication</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Realistic voice simulations</strong> that probe your decisions just like senior hiring panels</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Personalized milestone roadmaps</strong> based on your verified background gaps</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits Section (A2 item 7 & A5: 4 outcome-driven bullets) */}
        <section id="benefits" className="py-20 sm:py-28 px-4 border-t border-border/60 bg-white/30 backdrop-blur-xs">
          <div className="studio-frame">
            <div className="max-w-[680px] mb-14">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight [text-wrap:balance]">
                Designed around how engineering hiring decisions actually happen
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Benefit 1 */}
              <div className="p-6 rounded-2xl bg-white border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Objective rubric scoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                  Evaluate answers against real hiring bar criteria instead of subjective encouragement or raw code submission passes.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="p-6 rounded-2xl bg-white border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Targeted milestone roadmaps</h3>
                <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                  Turn your experience gaps into a structured sprint plan with clear daily exercises and measurable progress marks.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="p-6 rounded-2xl bg-white border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Realistic audio simulations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                  Speak through complex architecture decisions out loud under realistic time pressure with interactive AI follow up questions.
                </p>
              </div>

              {/* Benefit 4 */}
              <div className="p-6 rounded-2xl bg-white border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Verifiable readiness metrics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                  Measure your confidence across distributed systems, algorithms, and leadership STAR responses before scheduling real on关系的.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section (A2 item 8: 3 steps) */}
        <section id="how-it-works" className="py-20 sm:py-28 px-4 studio-frame">
          <div className="max-w-[680px] mx-auto text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
              Three Step Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight [text-wrap:balance]">
              How CareerAI prepares you for your target role
            </h2>
            <p className="text-base text-muted-foreground mt-3 [text-wrap:pretty]">
              A predictable training loop designed to convert raw technical know how into crisp, persuasive interview delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1020px] mx-auto">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white/70 border border-border/80 shadow-surface space-y-4">
              <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-semibold flex items-center justify-center">
                01
              </span>
              <h3 className="text-lg font-semibold text-foreground">Map your target role</h3>
              <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                Share your resume, target level, and interview timeline. CareerAI identifies the specific competencies required for your target company tier.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white/70 border border-border/80 shadow-surface space-y-4">
              <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-semibold flex items-center justify-center">
                02
              </span>
              <h3 className="text-lg font-semibold text-foreground">Train with simulated panels</h3>
              <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                Complete interactive system design and behavioral rounds where the AI pushes back on trade offs, edge cases, and scalability assumptions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white/70 border border-border/80 shadow-surface space-y-4">
              <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-mono text-sm font-semibold flex items-center justify-center">
                03
              </span>
              <h3 className="text-lg font-semibold text-foreground">Refine with actionable rubrics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed [text-wrap:pretty]">
                Review line by line feedback, replay transcript highlights, and complete targeted daily drills that eliminate specific technical blind spots.
              </p>
            </div>
          </div>
        </section>

        {/* Telemetry & Security Guarantees (Section A1 Proof points) */}
        <section className="py-16 px-4 studio-frame">
          <div className="rounded-3xl border border-white/80 bg-white/80 shadow-surface p-6 sm:p-10 backdrop-blur-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              <div className="pt-4 sm:pt-0">
                <span className="text-3xl sm:text-4xl font-semibold text-foreground font-mono block">14</span>
                <span className="text-xs text-muted-foreground mt-1 block">Interview archetypes supported</span>
              </div>
              <div className="pt-4 sm:pt-0">
                <span className="text-3xl sm:text-4xl font-semibold text-foreground font-mono block">4.8 / 5.0</span>
                <span className="text-xs text-muted-foreground mt-1 block">Candidate rubric clarity rating</span>
              </div>
              <div className="pt-4 sm:pt-0">
                <span className="text-3xl sm:text-4xl font-semibold text-foreground font-mono block">91.4%</span>
                <span className="text-xs text-muted-foreground mt-1 block">Milestone completion rate</span>
              </div>
              <div className="pt-4 sm:pt-0">
                <span className="text-3xl sm:text-4xl font-semibold text-foreground font-mono block">0</span>
                <span className="text-xs text-muted-foreground mt-1 block">Telemetry tracking or data selling</span>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions Section (A2 item 10: 8 items for AEO) */}
        <section id="faq" className="py-20 sm:py-28 px-4 border-t border-border/60 bg-white/40">
          <div className="max-w-[760px] mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight [text-wrap:balance]">
                Everything you need to know about preparation
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/80 bg-white overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground hover:bg-muted/30 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="[text-wrap:pretty]">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-foreground" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40 [text-wrap:pretty]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final Risk Reversal & Call to Action (A2 items 11 & 12) */}
        <section className="py-24 sm:py-32 px-4 studio-frame text-center">
          <div className="max-w-[680px] mx-auto space-y-6">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
              Immediate Access
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight [text-wrap:balance]">
              Start your interview preparation today.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed [text-wrap:pretty]">
              Test your readiness on real system design questions, calibrate your rubric score, and walk into your next interview with complete confidence.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                Start free practice
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleGuestWorkspace}
                disabled={isGuestLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-border/80 text-foreground font-semibold text-sm hover:bg-muted/40 active:scale-[0.98] transition-all duration-200"
              >
                {isGuestLoading ? "Opening sandbox..." : "Explore guest sandbox"}
              </button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              No credit card required · Free guest workspace · Instant setup
            </p>
          </div>
        </section>
      </main>

      {/* Branded Semantic Footer */}
      <SiteFooter />
    </div>
  );
}
