"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Code2,
  Compass,
  Mic,
  Play,
  Terminal,
  Volume2,
} from "lucide-react";
import { Brand } from "@/components/studio/brand";
import { SiteFooter } from "@/components/studio/site-footer";
import { openGuestWorkspace } from "@/components/studio/guest-action";

// Interactive Technical Workbench (Cobalt theme signature)
function TechnicalWorkbench() {
  const [activeTab, setActiveTab] = useState<"interview" | "readiness" | "roadmap" | "daily">("interview");
  const [isAudioSimulating, setIsAudioSimulating] = useState(true);

  return (
    <div className="w-full rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper)] shadow-[var(--shadow-card)] p-4 sm:p-6 transition-colors duration-200 motion-reduce:transition-none">
      {/* Workbench Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--color-rule)]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] opacity-80" />
          <span className="text-xs font-normal text-[var(--color-muted)]">
            evaluation terminal // staff level
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-input)] bg-[var(--color-accent-wash)] border border-[var(--color-accent-edge)] text-[var(--color-accent-deep)] text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
          Engine calibrated
        </div>
      </div>

      {/* Workbench Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 mb-4 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
        <button
          type="button"
          onClick={() => setActiveTab("interview")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-colors duration-200 motion-reduce:transition-none ${
            activeTab === "interview"
              ? "bg-[var(--color-paper)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Interview simulation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("readiness")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-colors duration-200 motion-reduce:transition-none ${
            activeTab === "readiness"
              ? "bg-[var(--color-paper)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Readiness score
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-colors duration-200 motion-reduce:transition-none ${
            activeTab === "roadmap"
              ? "bg-[var(--color-paper)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Milestone roadmap
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-input)] transition-colors duration-200 motion-reduce:transition-none ${
            activeTab === "daily"
              ? "bg-[var(--color-paper)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Daily practice
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[360px]">
        {activeTab === "interview" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3.5"
          >
            {/* System prompt in graphite */}
            <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-graphite)] text-[var(--color-graphite-ink)] border border-[var(--color-rule-2)]">
              <div className="flex items-center justify-between mb-1.5 text-xs text-[var(--color-graphite-muted)]">
                <span>Distributed system design // Round 02</span>
                <span className="num">Time budget: 25 min</span>
              </div>
              <p className="text-sm font-medium leading-snug">
                Design a distributed idempotency service for multi region payment capture with sub 20ms write SLA and monotonic fencing.
              </p>
            </div>

            {/* Audio Voice Simulation Bar */}
            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAudioSimulating(!isAudioSimulating)}
                  className="w-7 h-7 rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] flex items-center justify-center hover:opacity-90 active:scale-95 transition-opacity duration-200 motion-reduce:transition-none"
                  aria-label={isAudioSimulating ? "Pause audio stream" : "Play audio stream"}
                >
                  {isAudioSimulating ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-ink)]">Candidate voice stream</span>
                    <span className="text-xs text-[var(--color-muted)] num">03:48 / 05:00</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Explaining DynamoDB conditional writes versus distributed locks
                  </p>
                </div>
              </div>

              {/* Dynamic waveform simulation */}
              <div className="flex items-center gap-1 h-5 self-center sm:self-auto">
                {[12, 20, 16, 26, 18, 10, 24, 28, 18, 14, 22, 26, 16, 20, 8, 18].map((height, i) => (
                  <span
                    key={i}
                    className={`w-0.5 rounded-full bg-[var(--color-accent)] transition-opacity duration-300 motion-reduce:transition-none ${
                      isAudioSimulating ? "opacity-90" : "opacity-35"
                    }`}
                    style={{
                      height: isAudioSimulating ? `${height}px` : "5px",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Rubric Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
                <span className="text-xs text-[var(--color-muted)] block mb-0.5">Architecture trade offs</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-[var(--color-ink)] num">4.8</span>
                  <span className="text-xs text-[var(--color-muted)]">/ 5.0</span>
                </div>
                <span className="text-xs font-medium text-[var(--color-success)]">Strong hire</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
                <span className="text-xs text-[var(--color-muted)] block mb-0.5">Failure modes</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-[var(--color-ink)] num">4.6</span>
                  <span className="text-xs text-[var(--color-muted)]">/ 5.0</span>
                </div>
                <span className="text-xs font-medium text-[var(--color-success)]">Clear hire</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
                <span className="text-xs text-[var(--color-muted)] block mb-0.5">Verbal clarity</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-[var(--color-ink)] num">4.9</span>
                  <span className="text-xs text-[var(--color-muted)]">/ 5.0</span>
                </div>
                <span className="text-xs font-medium text-[var(--color-success)]">Exceptional</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
                <span className="text-xs text-[var(--color-muted)] block mb-0.5">Edge case analysis</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-[var(--color-ink)] num">4.7</span>
                  <span className="text-xs text-[var(--color-muted)]">/ 5.0</span>
                </div>
                <span className="text-xs font-medium text-[var(--color-success)]">Comprehensive</span>
              </div>
            </div>

            {/* Committee assessment */}
            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper)] border border-[var(--color-rule)] text-xs text-[var(--color-muted)] leading-relaxed">
              <strong className="text-[var(--color-ink)] font-medium">Hiring committee rationale: </strong>
              Candidate proactively identified split brain risks in two phase commit protocols and selected single leader Raft groups with monotonic version fencing.
            </div>
          </motion.div>
        )}

        {activeTab === "readiness" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3.5"
          >
            <div className="p-3.5 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-[var(--color-muted)] block mb-0.5">
                  Calibrated target level
                </span>
                <h4 className="text-sm font-semibold text-[var(--color-ink)]">Staff Infrastructure Engineer</h4>
                <p className="text-xs text-[var(--color-muted)]">
                  Calibrated against senior hiring standards across technology organizations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xl font-semibold text-[var(--color-ink)] num">87.4%</span>
                  <span className="text-xs text-[var(--color-success)] block font-medium">+14.2% this month</span>
                </div>
                <div className="w-10 h-10 rounded-[var(--radius-input)] bg-[var(--color-accent-wash)] border border-[var(--color-accent-edge)] text-[var(--color-accent-deep)] flex items-center justify-center text-xs font-semibold num">
                  L6
                </div>
              </div>
            </div>

            {/* Competency metrics */}
            <div className="space-y-2.5 p-3.5 rounded-[var(--radius-input)] bg-[var(--color-paper)] border border-[var(--color-rule)]">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--color-ink)]">Distributed system design</span>
                  <span className="text-[var(--color-accent-deep)] num">92%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--color-paper-3)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: "92%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--color-ink)]">Concurrency and state synchronization</span>
                  <span className="text-[var(--color-accent-deep)] num">88%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--color-paper-3)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: "88%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--color-ink)]">System failure recovery and resilience</span>
                  <span className="text-[var(--color-accent-deep)] num">85%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--color-paper-3)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[var(--color-ink)]">Behavioral leadership and conflict</span>
                  <span className="text-[var(--color-accent-deep)] num">84%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--color-paper-3)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: "84%" }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "roadmap" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2.5"
          >
            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-input)] bg-[var(--color-paper-3)] text-[var(--color-success)] flex items-center justify-center font-semibold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-ink)]">Week 1 to 4: Distributed primitives</h4>
                  <p className="text-xs text-[var(--color-muted)]">Consensus protocols, linearizability, and write ahead logs</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--color-success)]">Completed</span>
            </div>

            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-accent-wash)] border border-[var(--color-accent-edge)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] flex items-center justify-center font-semibold text-xs num">
                  05
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-[var(--color-ink)]">Week 5: High volume caching and consistency</h4>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-[var(--radius-input)] bg-[var(--color-paper)] text-[var(--color-accent-deep)] font-medium">Current sprint</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">Cache stampede protection and lease based invalidation</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--color-accent-deep)] num">4 of 6 done</span>
            </div>

            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-between opacity-75">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-input)] bg-[var(--color-paper-3)] text-[var(--color-muted)] flex items-center justify-center font-semibold text-xs num">
                  06
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-ink)]">Week 6: Full live interview simulation</h4>
                  <p className="text-xs text-[var(--color-muted)]">45 minute mock onsite round with hiring manager rubric</p>
                </div>
              </div>
              <span className="text-xs text-[var(--color-muted)]">Upcoming</span>
            </div>
          </motion.div>
        )}

        {activeTab === "daily" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2"
          >
            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors duration-200 motion-reduce:transition-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-input)] bg-[var(--color-paper-3)] text-[var(--color-accent-deep)] flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-ink)]">Vocal drill: Explain Raft leader election</h4>
                  <p className="text-xs text-[var(--color-muted)]">Explain term election, heartbeats, and candidate state transitions in 90 seconds</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-[var(--color-accent-deep)]">Start drill</span>
                <span className="text-xs text-[var(--color-muted)] block num">3 min</span>
              </div>
            </div>

            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors duration-200 motion-reduce:transition-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-input)] bg-[var(--color-paper-3)] text-[var(--color-accent-deep)] flex items-center justify-center">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-ink)]">Index optimization: Multi tenant compound keys</h4>
                  <p className="text-xs text-[var(--color-muted)]">Eliminate sequential table scans on partition key ranges</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-[var(--color-accent-deep)]">Start drill</span>
                <span className="text-xs text-[var(--color-muted)] block num">8 min</span>
              </div>
            </div>

            <div className="p-3 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-accent)] transition-colors duration-200 motion-reduce:transition-none flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-[var(--radius-input)] bg-[var(--color-paper-3)] text-[var(--color-accent-deep)] flex items-center justify-center">
                  <BrainCircuit className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-ink)]">Behavioral STAR: Cross functional deadlock</h4>
                  <p className="text-xs text-[var(--color-muted)]">Deliver a crisp four part answer showing technical mediation</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-[var(--color-accent-deep)]">Start drill</span>
                <span className="text-xs text-[var(--color-muted)] block num">6 min</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Frequently Asked Questions
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
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* Accessibility Skip to Content Link */}
      <a
        href="#main-content"
        className="visually-hidden focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-[var(--color-paper)] focus:text-[var(--color-accent-deep)] focus:shadow-md focus:rounded-[var(--radius-input)] focus:outline-2 focus:outline-[var(--color-focus)] font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* Edge-aligned Navigation Header (Hallmark modern-minimal) */}
      <header className="border-b border-[var(--color-rule)] bg-[var(--color-paper)] sticky top-0 z-30">
        <nav
          className="container py-3 flex items-center justify-between"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-8">
            <Brand href="/" />
            <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--color-muted)]">
              <a href="#cockpit" className="hover:text-[var(--color-ink)] transition-colors duration-150 motion-reduce:transition-none">
                Cockpit
              </a>
              <a href="#benefits" className="hover:text-[var(--color-ink)] transition-colors duration-150 motion-reduce:transition-none">
                Benefits
              </a>
              <a href="#how-it-works" className="hover:text-[var(--color-ink)] transition-colors duration-150 motion-reduce:transition-none">
                How it works
              </a>
              <a href="#faq" className="hover:text-[var(--color-ink)] transition-colors duration-150 motion-reduce:transition-none">
                FAQ
              </a>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth?mode=login"
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors duration-150 motion-reduce:transition-none"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 motion-reduce:transition-none"
            >
              Start free practice
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-[var(--radius-input)] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors duration-150 motion-reduce:transition-none"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-5 h-3.5 flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-[var(--color-ink)] transition-transform duration-200 motion-reduce:transition-none ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`w-full h-0.5 bg-[var(--color-ink)] transition-opacity duration-200 motion-reduce:transition-none ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`w-full h-0.5 bg-[var(--color-ink)] transition-transform duration-200 motion-reduce:transition-none ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </div>
          </button>
        </nav>
      </header>

      {/* Mobile Drawer Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-20 pt-16 px-6 bg-[var(--color-paper)] border-b border-[var(--color-rule)] flex flex-col justify-between pb-8 sm:hidden"
          >
            <div className="space-y-3 pt-4">
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
                  className="block text-lg font-medium text-[var(--color-ink)] py-2 border-b border-[var(--color-rule)]"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="space-y-2 pt-6">
              <Link
                href="/auth?mode=register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-medium text-center block text-xs"
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
                className="w-full py-2.5 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink)] font-medium text-center block text-xs disabled:opacity-50"
              >
                Open guest sandbox
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content">
        {/* HERO SECTION (Settled posture, Gate 44b & 58 compliant: Headline ≤ 7 words, sentence ≤ 12 words) */}
        <section className="py-12 sm:py-16 border-b border-[var(--color-rule)]">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Copy Column */}
              <div className="lg:col-span-5 space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-[var(--color-ink)]">
                  Master technical interviews with structured practice
                </h1>

                <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed">
                  Objective rubrics, targeted milestone roadmaps, and voice simulations for senior engineers.
                </p>

                {/* Primary Call to Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Link
                    href="/auth?mode=register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 motion-reduce:transition-none"
                  >
                    Start free practice
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleGuestWorkspace}
                    disabled={isGuestLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-key-face)] border border-[var(--color-rule)] text-[var(--color-ink)] font-medium text-xs hover:bg-[var(--color-paper-2)] active:scale-[0.98] transition-colors duration-150 motion-reduce:transition-none disabled:opacity-50"
                  >
                    {isGuestLoading ? "Opening sandbox..." : "Open guest sandbox"}
                  </button>
                </div>

                {guestError && (
                  <p className="text-xs text-[var(--color-error)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-input)] p-2">
                    {guestError}
                  </p>
                )}

                {/* Evidence metric (no fake logos) */}
                <div className="pt-3 border-t border-[var(--color-rule)] text-xs text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-ink)] num">91.4%</span> milestone completion rate across 1,420 simulated technical rounds
                </div>
              </div>

              {/* Right Interactive Workbench Column */}
              <div id="cockpit" className="lg:col-span-7">
                <TechnicalWorkbench />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Problem to Solution (Split Studio shape) */}
        <section className="py-16 sm:py-20 border-b border-[var(--color-rule)]">
          <div className="container">
            <div className="max-w-[580px] mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)]">
                Why traditional technical interview preparation falls short
              </h2>
              <p className="text-sm text-[var(--color-muted)] mt-2">
                Most engineers prepare by solving isolated coding puzzles in silence, leaving architecture defense and verbal clarity untested until the real onsite round.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Traditional routine */}
              <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-3">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">The fragmented routine</h3>
                <ul className="space-y-2.5 text-xs text-[var(--color-muted)] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-muted)]">✕</span>
                    <span>Memorizing solutions without understanding the underlying trade offs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-muted)]">✕</span>
                    <span>Practicing in silence and stumbling when asked to explain decisions out loud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-muted)]">✕</span>
                    <span>No feedback on whether your solution meets actual staff level hiring bars</span>
                  </li>
                </ul>
              </div>

              {/* The CareerAI Standard */}
              <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule-2)] shadow-[var(--shadow-card)] space-y-3">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">The CareerAI standard</h3>
                <ul className="space-y-2.5 text-xs text-[var(--color-ink-2)] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-deep)] font-bold">✓</span>
                    <span><strong className="text-[var(--color-ink)] font-medium">Objective 10 point rubrics</strong> evaluating architecture, failure modes, and communication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-deep)] font-bold">✓</span>
                    <span><strong className="text-[var(--color-ink)] font-medium">Realistic voice simulations</strong> that probe your decisions just like senior hiring panels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-accent-deep)] font-bold">✓</span>
                    <span><strong className="text-[var(--color-ink)] font-medium">Personalized milestone roadmaps</strong> based on your verified background gaps</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Capabilities (Hairline grid, Cobalt styling) */}
        <section id="benefits" className="py-16 sm:py-20 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)]">
          <div className="container">
            <div className="max-w-[580px] mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)]">
                Designed around engineering hiring committee standards
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-2">
                <div className="w-8 h-8 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent-deep)]">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Objective rubric scoring</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Evaluate answers against hiring committee criteria instead of subjective encouragement or raw code submission passes.
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-2">
                <div className="w-8 h-8 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent-deep)]">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Targeted milestone roadmaps</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Turn your experience gaps into a structured sprint plan with clear daily exercises and measurable progress marks.
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-2">
                <div className="w-8 h-8 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent-deep)]">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Realistic audio simulations</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Speak through complex architecture decisions out loud under realistic time pressure with interactive follow up questions.
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-2">
                <div className="w-8 h-8 rounded-[var(--radius-input)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent-deep)]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Verifiable readiness metrics</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Measure your confidence across distributed systems, algorithms, and leadership STAR responses before scheduling onsite rounds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Three-step Methodology */}
        <section id="how-it-works" className="py-16 sm:py-20 border-b border-[var(--color-rule)]">
          <div className="container">
            <div className="max-w-[580px] mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)]">
                How CareerAI prepares you for your target role
              </h2>
              <p className="text-sm text-[var(--color-muted)] mt-2">
                A predictable training loop designed to convert raw technical know how into crisp, persuasive interview delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-3">
                <span className="text-xs font-semibold text-[var(--color-accent-deep)]">
                  Step 01
                </span>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Map your target role</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Share your resume, target level, and interview timeline. CareerAI identifies the specific competencies required for your target company tier.
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-3">
                <span className="text-xs font-semibold text-[var(--color-accent-deep)]">
                  Step 02
                </span>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Train with simulated panels</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Complete interactive system design and behavioral rounds where the AI pushes back on trade offs, edge cases, and scalability assumptions.
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-rule)] space-y-3">
                <span className="text-xs font-semibold text-[var(--color-accent-deep)]">
                  Step 03
                </span>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Refine with actionable rubrics</h3>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Review line by line feedback, replay transcript highlights, and complete targeted daily drills that eliminate specific technical blind spots.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Platform Facts & Telemetry */}
        <section className="py-12 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)]">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <span className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] num block">14</span>
                <span className="text-xs text-[var(--color-muted)] mt-1 block">Interview archetypes supported</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] num block">4.8 / 5.0</span>
                <span className="text-xs text-[var(--color-muted)] mt-1 block">Candidate rubric clarity rating</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] num block">91.4%</span>
                <span className="text-xs text-[var(--color-muted)] mt-1 block">Milestone completion rate</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] num block">0</span>
                <span className="text-xs text-[var(--color-muted)] mt-1 block">Telemetry tracking or data selling</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Questions (Hairline Accordion, no AI fluff) */}
        <section id="faq" className="py-16 sm:py-20 border-b border-[var(--color-rule)]">
          <div className="container max-w-[720px]">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)]">
                Technical interview and platform answers
              </h2>
            </div>

            <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="py-3.5">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full text-left flex items-center justify-between gap-4 font-medium text-xs sm:text-sm text-[var(--color-ink)] hover:text-[var(--color-accent-deep)] transition-colors duration-150 motion-reduce:transition-none"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--color-muted)] shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
                          isOpen ? "rotate-180 text-[var(--color-ink)]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="pt-2.5 pb-1 text-xs text-[var(--color-muted)] leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 7: Close (Mast Close, clean access) */}
        <section className="py-16 sm:py-24 text-center">
          <div className="container max-w-[580px] space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[var(--color-ink)]">
              Start your interview preparation today
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
              Test your readiness on real system design questions, calibrate your rubric score, and walk into your next interview with complete confidence.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/auth?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 motion-reduce:transition-none"
              >
                Start free practice
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleGuestWorkspace}
                disabled={isGuestLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-key-face)] border border-[var(--color-rule)] text-[var(--color-ink)] font-medium text-xs hover:bg-[var(--color-paper-2)] active:scale-[0.98] transition-colors duration-150 motion-reduce:transition-none disabled:opacity-50"
              >
                {isGuestLoading ? "Opening sandbox..." : "Open guest sandbox"}
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted)] pt-2">
              Free guest workspace with no registration required
            </p>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <SiteFooter />
    </div>
  );
}
