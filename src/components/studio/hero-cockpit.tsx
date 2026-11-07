"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

type CockpitTab = "interview" | "roadmap" | "readiness";

export function HeroCockpit() {
  const [activeTab, setActiveTab] = useState<CockpitTab>("interview");

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#11131f]/95 shadow-2xl p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      {/* Top Cockpit Header Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Evaluation terminal // Staff benchmark
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-xs font-mono text-slate-400 dark:text-slate-500">
            42 ms latency
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            <Sparkles size={12} className="text-indigo-500" />
            <span>Rubric calibrated</span>
          </div>
        </div>
      </div>

      {/* Cockpit Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => setActiveTab("interview")}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            activeTab === "interview"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Terminal size={14} className={activeTab === "interview" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>Mock interview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            activeTab === "roadmap"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers size={14} className={activeTab === "roadmap" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>Study roadmap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("readiness")}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            activeTab === "readiness"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Activity size={14} className={activeTab === "readiness" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>Readiness radar</span>
        </button>
      </div>

      {/* Cockpit Content Panel with smooth decelerating transitions */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "interview" && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Question Context Card */}
              <div className="rounded-lg border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/60 p-3 sm:p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                    Question 3 of 5 · Systems Architecture
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    Time: 18m 42s
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  Design a high throughput LRU cache with constant time eviction
                </h4>
                <div className="rounded-md bg-white dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/70 p-2.5 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Candidate response snippet</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">Recorded</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
                    Doubly linked list combined with a hash map. Sentinel head and tail nodes avoid branch conditions during O(1) eviction and node promotion.
                  </p>
                </div>
              </div>

              {/* Rubric Evaluation Result */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold shadow-xs">
                      9.2
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Rubric score · Strong hire signal
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Evaluated across 4 architectural competencies
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Top 6% percentile
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-emerald-500/20">
                  <div className="p-2 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Time complexity</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">10 / 10 · Strict O(1)</div>
                  </div>
                  <div className="p-2 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Data structures</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">9.5 / 10 · Linked Map</div>
                  </div>
                  <div className="p-2 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Concurrency</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">8.5 / 10 · Read write lock</div>
                  </div>
                  <div className="p-2 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Edge cases</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">9.0 / 10 · Overflow handled</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic-none">
                  Feedback: Clear explanation of why sentinel nodes eliminate boundary checks during concurrent node detachment.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Progress Summary Card */}
              <div className="rounded-lg border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/60 p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    24 week staff engineering curriculum
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                    Week 4 active · 83% completed
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full w-[83%]" />
                </div>
              </div>

              {/* Task Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        Kahn topological sort for service dependency trees
                      </div>
                      <div className="text-[11px] text-slate-500">Completed in 45 minutes · Verified</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-medium">
                    +25 pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        Redis sliding window rate limiter implementation
                      </div>
                      <div className="text-[11px] text-slate-500">Completed in 60 minutes · Verified</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-medium">
                    +30 pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        Distributed consensus protocols with Paxos and Raft
                      </div>
                      <div className="text-[11px] text-slate-500">Scheduled for today · 90 minutes</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-medium">
                    Next up
                  </span>
                </div>
              </div>

              {/* Weekly Milestone Callout */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60 text-xs">
                <span className="text-slate-600 dark:text-slate-400">Weekly deliverable</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Distributed systems benchmark mock passed
                </span>
              </div>
            </motion.div>
          )}

          {activeTab === "readiness" && (
            <motion.div
              key="readiness"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Readiness Index Banner */}
              <div className="rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 sm:p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400">
                    Interview readiness index
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    78 out of 100 · Ready for on site
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Senior to staff engineering benchmark
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    <Zap size={12} />
                    High momentum
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">14 day practice streak</div>
                </div>
              </div>

              {/* Competency Mastery Bars */}
              <div className="rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 p-3 sm:p-3.5 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">Algorithms and Data Structures</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">88%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">Distributed Systems Architecture</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">82%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[82%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">Communication and Trade Offs</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">Database Indexing and Storage</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">74%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[74%]" />
                  </div>
                </div>
              </div>

              {/* Target Company Match Chips */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 text-xs">
                <span className="text-slate-500">Target role fit:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    Stripe 84%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    Datadog 89%
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    Google 76%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cockpit Footer Status Line */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Interactive cockpit · Click tabs to explore</span>
        </div>
        <span className="font-mono">Real time feedback engine</span>
      </div>
    </div>
  );
}
