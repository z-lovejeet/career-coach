"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle2,
  Circle,
  Building2,
  Code2,
  ArrowRight,
  Zap,
  BookOpen,
  Flame,
  Star,
  X,
  ChevronRight,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Analysis, Task, CompanyRecommendation, CompanyMatch } from "@/types";

interface StreakInfo {
  streak: { current: number; longest: number };
  xp: { total: number; level: number; xpProgress: number };
}

interface AgenticAlert {
  id: string;
  type: 'action' | 'warning' | 'critical' | 'info' | 'motivation';
  title: string;
  message: string;
  action?: { label: string; href: string };
  icon: string;
}

interface DashboardData {
  analysis: Analysis | null;
  tasks: Task[];
  recommendations: CompanyRecommendation | null;
  profile: { full_name: string; onboarding_complete: boolean } | null;
  streakInfo: StreakInfo | null;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DashboardPage() {
  const { data: dashboardRes, isLoading: loadingDb } = useSWR('/api/dashboard', fetcher);
  const { data: alertsRes } = useSWR('/api/alerts/check', fetcher);

  const data: DashboardData = dashboardRes?.success ? dashboardRes.data : {
    analysis: null,
    tasks: [],
    recommendations: null,
    profile: null,
    streakInfo: null,
  };

  const alerts: AgenticAlert[] = alertsRes?.success ? alertsRes.data.alerts : [];
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const router = useRouter();

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set(prev).add(id));
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));
  const loading = loadingDb && !dashboardRes;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data.analysis) {
    return (
      <GettingStarted
        name={data.profile?.full_name}
        onboardingComplete={data.profile?.onboarding_complete || false}
        hasAnalysis={false}
        hasRecommendations={!!data.recommendations}
        hasTasks={data.tasks.length > 0}
      />
    );
  }

  const { analysis, tasks, recommendations } = data;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const currentFit = (recommendations?.current_fit_companies || []) as CompanyMatch[];
  const targets = (recommendations?.target_companies || []) as CompanyMatch[];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Executive Command Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Command HQ
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">Placement Telemetry Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {data.profile?.full_name?.split(" ")[0] || "Candidate"}
          </h1>
        </div>

        {data.streakInfo && (
          <div className="flex items-center gap-2 font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E111A] border border-orange-500/25 text-orange-400">
              <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
              <span className="text-xs font-semibold tabular-nums">{data.streakInfo.streak.current}</span>
              <span className="text-[10px] text-[#8A96AA]">DAY STREAK</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E111A] border border-blue-500/25 text-blue-400">
              <Star className="w-3.5 h-3.5 fill-blue-500/30" />
              <span className="text-xs font-semibold tabular-nums">Level {data.streakInfo.xp.level}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── High-Priority Autonomous Alerts ─── */}
      {visibleAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-[#0E111A] overflow-hidden divide-y divide-white/[0.06] shadow-sm">
          <div className="px-4 py-2.5 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-semibold uppercase tracking-wider text-[11px]">
                Proactive Mentor Telemetry
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8A96AA]">
              {visibleAlerts.length} unresolved {visibleAlerts.length > 1 ? 'items' : 'item'}
            </span>
          </div>
          {visibleAlerts.slice(0, 2).map((alert) => (
            <div key={alert.id} className="p-4 flex items-start gap-3.5 hover:bg-white/[0.02] transition-colors">
              <span className="text-lg flex-shrink-0 mt-0.5">{alert.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-0.5">{alert.title}</p>
                <p className="text-xs text-[#8A96AA] leading-relaxed">{alert.message}</p>
                {alert.action && (
                  <Button
                    size="sm"
                    className="mt-2.5 h-7 px-3 rounded-md text-xs font-mono bg-primary hover:bg-blue-500 text-white cursor-pointer"
                    onClick={() => router.push(alert.action!.href)}
                  >
                    {alert.action.label} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-[#64748B] hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Score & Readiness Metrics (Precision Bento) ─── */}
      <div className="grid gap-5 md:grid-cols-12">
        {/* Circular Gauge Card */}
        <motion.div
          className="md:col-span-4 rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col items-center justify-between text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-full flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] tracking-wider uppercase text-[#8A96AA]">Placement Gauge</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              DYNAMIC
            </span>
          </div>

          <div className="relative w-36 h-36 my-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#blueGaugeGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - analysis.readiness_score / 100) }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="blueGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="60%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-4xl font-bold tracking-tight text-white tabular-nums">{analysis.readiness_score}</span>
              <span className="text-[10px] text-[#8A96AA] uppercase tracking-wider">READINESS</span>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-white/[0.06]">
            <p className="text-xs font-semibold text-white">
              {analysis.readiness_score >= 75
                ? "Tier-1 Product Placement Ready"
                : analysis.readiness_score >= 45
                ? "High Potential • Close Target Gaps"
                : "Foundation Stage • Complete Daily Tasks"}
            </p>
            <p className="text-[11px] text-[#8A96AA] mt-1 font-mono">
              Calibrated against Google, Uber & Stripe rubrics
            </p>
          </div>
        </motion.div>

        {/* 6 KPI Stat Tiles */}
        <div className="md:col-span-8 grid gap-3.5 grid-cols-2 sm:grid-cols-3">
          <StatTile
            icon={CheckCircle2}
            label="Tasks Complete"
            value={`${completedTasks}/${totalTasks}`}
            sub={`${completionRate}% completion rate`}
            color="text-emerald-400"
          />
          <StatTile
            icon={Building2}
            label="Matched Orgs"
            value={String(currentFit.length + targets.length)}
            sub={`${currentFit.length} fit, ${targets.length} target`}
            color="text-blue-400"
          />
          <StatTile
            icon={TrendingUp}
            label="Core Strength"
            value={analysis.strengths[0]?.skill || "DSA"}
            sub="Verified via dossier"
            color="text-sky-400"
          />
          <StatTile
            icon={Target}
            label="Primary Gap"
            value={analysis.missing_skills[0]?.skill || "System Design"}
            sub="High priority sprint"
            color="text-amber-400"
          />
          <StatTile
            icon={Code2}
            label="Extracted Skills"
            value={String(analysis.extracted_skills.length)}
            sub="Gemini multi-modal"
            color="text-indigo-400"
          />
          <StatTile
            icon={Zap}
            label="Top Target"
            value={targets[0]?.name || currentFit[0]?.name || "Google"}
            sub={targets[0] ? `${targets[0].match_score}% target fit` : "In analysis"}
            color="text-rose-400"
          />
        </div>
      </div>

      {/* ─── AI Assessment Dossier ─── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-white">Synthesized Placement Assessment</h3>
          </div>
          <span className="font-mono text-[10px] text-[#64748B]">ENGINE: GEMINI 3.8 FLASH</span>
        </div>
        <p className="text-xs sm:text-sm text-[#D0D6E2] leading-relaxed font-sans">
          {analysis.summary}
        </p>
      </div>

      {/* ─── Lower Split: High-Yield Tasks & Company Opportunities ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks Section */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                High-Yield Practice Tasks
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/tasks")}
                className="text-xs font-mono text-[#8A96AA] hover:text-white h-7 px-2 cursor-pointer"
              >
                All Tasks <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border border-white/[0.05] bg-[#0A0C13] flex items-center gap-3 transition-all ${
                      task.completed ? "opacity-40" : "hover:border-white/[0.12]"
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium flex-1 truncate ${task.completed ? "line-through text-[#64748B]" : "text-slate-200"}`}>
                      {task.title}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[#8A96AA] uppercase">
                      {task.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#64748B] text-xs font-mono">
                <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No tasks generated for this week.
              </div>
            )}
          </div>

          <Button
            onClick={() => router.push("/tasks")}
            variant="outline"
            className="w-full mt-4 h-9 rounded-lg border-white/[0.1] text-xs font-mono tracking-wider uppercase text-slate-300 hover:bg-white/[0.04] cursor-pointer"
          >
            Open Full Task Board
          </Button>
        </div>

        {/* Company Matches Section */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Company Compatibility Radar
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/companies")}
                className="text-xs font-mono text-[#8A96AA] hover:text-white h-7 px-2 cursor-pointer"
              >
                View Radar <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {currentFit.length > 0 || targets.length > 0 ? (
              <div className="space-y-2">
                {[...currentFit.slice(0, 3), ...targets.slice(0, 2)].map((company, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-white/[0.05] bg-[#0A0C13] flex items-center gap-3.5 hover:border-white/[0.12] transition-all"
                  >
                    <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-mono text-xs font-bold text-blue-400 flex-shrink-0 tabular-nums">
                      {company.match_score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{company.name}</p>
                      <p className="text-[11px] text-[#8A96AA] truncate">{company.role}</p>
                    </div>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase ${
                      company.match_score >= 60
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {company.match_score >= 60 ? "Current Fit" : "Target"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#64748B] text-xs font-mono">
                <Building2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No company matches recorded.
              </div>
            )}
          </div>

          <Button
            onClick={() => router.push("/companies")}
            variant="outline"
            className="w-full mt-4 h-9 rounded-lg border-white/[0.1] text-xs font-mono tracking-wider uppercase text-slate-300 hover:bg-white/[0.04] cursor-pointer"
          >
            Analyze Live Job Listings
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#0E111A] border border-white/[0.08] hover:border-white/[0.15] transition-colors flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A96AA] truncate">{label}</span>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white truncate tabular-nums">{value}</p>
        <p className="text-[11px] text-[#8A96AA] truncate mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function GettingStarted({
  name,
  onboardingComplete,
  hasAnalysis,
  hasRecommendations,
  hasTasks,
}: {
  name?: string | null;
  onboardingComplete: boolean;
  hasAnalysis: boolean;
  hasRecommendations: boolean;
  hasTasks: boolean;
}) {
  const router = useRouter();
  const steps = [
    { title: "Complete Onboarding Dossier", desc: "Ingest resume, self-rate proficiencies, and specify target tiers", href: "/onboarding", done: onboardingComplete },
    { title: "Run Deep AI Analysis", desc: "Let Gemini 3.8 decode gaps and calculate your readiness index", href: "/companies", done: hasAnalysis },
    { title: "Establish Target Company Match", desc: "Map your skillset against real product company criteria", href: "/companies", done: hasRecommendations },
    { title: "Generate Adaptive Task Plan", desc: "Groq 120B synthesizes a personalized weekly prep agenda", href: "/tasks", done: hasTasks },
  ];

  const nextStep = steps.find(s => !s.done);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-400 mb-2">
          <span>ONBOARDING CALIBRATION</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome to CareerAI, {name?.split(" ")[0] || "Candidate"}
        </h1>
        <p className="text-sm text-[#8A96AA] mt-1">
          Follow the 4-step initialization protocol to calibrate your placement pipeline.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 font-mono">
          <Cpu className="w-4 h-4 text-blue-400" />
          Initialization Checklist
        </h2>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => !step.done && router.push(step.href)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border border-white/[0.06] text-left transition-all ${
                step.done ? "opacity-50 bg-[#0A0C13] cursor-default" : "hover:border-blue-500/30 bg-[#0D0F17] cursor-pointer"
              }`}
            >
              {step.done ? (
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono text-xs font-bold flex-shrink-0">
                  0{i + 1}
                </div>
              )}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${step.done ? "line-through text-slate-400" : "text-white"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-[#8A96AA] mt-0.5">{step.desc}</p>
              </div>
              {!step.done && <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
          ))}
        </div>
      </div>

      {nextStep && (
        <div className="rounded-xl border border-blue-500/30 bg-[#0E111A] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400">Next Action</span>
            <h4 className="text-sm font-semibold text-white mt-0.5">{nextStep.title}</h4>
            <p className="text-xs text-[#8A96AA]">{nextStep.desc}</p>
          </div>
          <Button
            onClick={() => router.push(nextStep.href)}
            className="h-9 px-5 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm cursor-pointer"
          >
            Execute <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="grid gap-5 md:grid-cols-12">
        <div className="md:col-span-4 p-6 rounded-xl border border-white/[0.08] bg-[#0E111A]">
          <Skeleton className="w-36 h-36 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="md:col-span-8 grid gap-3.5 grid-cols-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.08] bg-[#0E111A]">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
