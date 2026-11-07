"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
} from "lucide-react";

type CockpitTab = "interview" | "roadmap" | "readiness";

export function HeroCockpit() {
  const [activeTab, setActiveTab] = useState<CockpitTab>("interview");

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#11131f] shadow-xl p-5 sm:p-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      {/* Clean, Premium Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Technical Evaluation
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Staff benchmark
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            9.2 / 10 Strong hire
          </span>
        </div>
      </div>

      {/* Spacious, Quiet Segment Control */}
      <div className="grid grid-cols-3 gap-1 p-1 mb-5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70">
        <button
          type="button"
          onClick={() => setActiveTab("interview")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            activeTab === "interview"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Terminal size={14} className={activeTab === "interview" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>Interview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            activeTab === "roadmap"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers size={14} className={activeTab === "roadmap" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>Roadmap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("readiness")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            activeTab === "readiness"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Activity size={14} className={activeTab === "readiness" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>Readiness</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="relative min-h-[290px]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "interview" && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3.5"
            >
              {/* Question Card */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Design a high throughput LRU cache
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    Round 3 of 5
                  </span>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/70 p-3 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  &ldquo;Doubly linked list combined with a hash map. Sentinel head and tail nodes avoid branch conditions during O(1) eviction and node promotion.&rdquo;
                </div>
              </div>

              {/* Rubric Evaluation Card */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    <div className="text-[11px] font-medium text-slate-500">Complexity</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Strict O(1)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    <div className="text-[11px] font-medium text-slate-500">Data structure</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Linked Map</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    <div className="text-[11px] font-medium text-slate-500">Concurrency</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Mutex safe</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Strong hire signal: clear explanation of why sentinel nodes eliminate boundary checks during concurrent node detachment.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Progress Summary Card */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    24 week curriculum
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                    Week 4 · 83% complete
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[83%]" />
                </div>
              </div>

              {/* Task Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Kahn topological sort for service dependency trees
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">45m</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Redis sliding window rate limiter implementation
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">60m</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      Distributed consensus protocols with Paxos and Raft
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Active</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "readiness" && (
            <motion.div
              key="readiness"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Readiness Index Banner */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Readiness Score</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    78 out of 100
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  Ready for on site
                </span>
              </div>

              {/* Competency Mastery Bars */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Algorithms and Data Structures</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">88%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Distributed Systems Architecture</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">82%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[82%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Communication and Trade Offs</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
                  </div>
                </div>
              </div>

              {/* Target Company Match Chips */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                <span className="text-slate-500">Target role fit:</span>
                <div className="flex items-center gap-2 font-medium">
                  <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    Stripe 84%
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    Datadog 89%
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    Google 76%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
