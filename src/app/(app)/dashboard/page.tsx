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
  BarChart3,
  ArrowRight,
  Zap,
  BookOpen,
  Flame,
  Star,
  AlertTriangle,
  Bell,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
  const { data: dashboardRes, isLoading: loadingDb, mutate: revalidateDb } = useSWR('/api/dashboard', fetcher);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            Welcome back, {data.profile?.full_name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your career preparation overview
          </p>
        </div>
        {data.streakInfo && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/8 border border-orange-500/15">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">{data.streakInfo.streak.current}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
              <Star className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">Lvl {data.streakInfo.xp.level}</span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="rounded-xl glass overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">AI Coach Insights</span>
            </div>
            <span className="text-xs text-muted-foreground">{visibleAlerts.length} alert{visibleAlerts.length > 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {visibleAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.01] transition-colors">
                <span className="text-xl flex-shrink-0 mt-0.5">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-0.5">{alert.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                  {alert.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 h-7 text-xs"
                      onClick={() => router.push(alert.action!.href)}
                    >
                      {alert.action.label} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
                <button onClick={() => dismissAlert(alert.id)} className="text-muted-foreground/40 hover:text-foreground transition-colors flex-shrink-0 mt-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score + Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Readiness Score */}
        <motion.div
          className="md:col-span-1 p-6 rounded-xl glass text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - analysis.readiness_score / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{analysis.readiness_score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className="text-sm font-medium">Readiness</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {analysis.readiness_score >= 70 ? "Great progress!" : analysis.readiness_score >= 40 ? "Keep going!" : "Let's improve!"}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="md:col-span-3 grid gap-3 grid-cols-2 sm:grid-cols-3">
          <StatCard icon={CheckCircle2} label="Tasks Done" value={`${completedTasks}/${totalTasks}`} sub={`${completionRate}% completion`} color="text-emerald-400" index={0} />
          <StatCard icon={Building2} label="Company Matches" value={String(currentFit.length + targets.length)} sub={`${currentFit.length} current fit`} color="text-blue-400" index={1} />
          <StatCard icon={TrendingUp} label="Strengths" value={String(analysis.strengths.length)} sub={analysis.strengths[0]?.skill || "—"} color="text-primary" index={2} />
          <StatCard icon={Target} label="Skill Gaps" value={String(analysis.missing_skills.length)} sub={analysis.missing_skills[0]?.skill || "None!"} color="text-amber-400" index={3} />
          <StatCard icon={Code2} label="Skills" value={String(analysis.extracted_skills.length)} sub="Identified by AI" color="text-cyan-400" index={4} />
          <StatCard icon={Zap} label="Top Target" value={targets[0]?.name || "—"} sub={targets[0] ? `${targets[0].match_score}% match` : "Run analysis"} color="text-rose-400" index={5} />
        </div>
      </div>

      {/* AI Summary */}
      <motion.div
        className="p-5 rounded-xl glass"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Assessment</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
      </motion.div>

      {/* Tasks + Companies */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tasks */}
        <motion.div
          className="p-5 rounded-xl glass"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tasks
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {tasks.length > 0 ? (
            <div className="space-y-1">
              {tasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    task.completed ? "opacity-40" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                  )}
                  <span className={`text-sm flex-1 truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{task.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-30" />
              No tasks yet
            </div>
          )}
        </motion.div>

        {/* Companies */}
        <motion.div
          className="p-5 rounded-xl glass"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Company Matches
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/companies")} className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {currentFit.length > 0 || targets.length > 0 ? (
            <div className="space-y-1">
              {[...currentFit.slice(0, 3), ...targets.slice(0, 2)].map((company, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {company.match_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{company.role}</p>
                  </div>
                  <span className={`text-[10px] font-medium ${company.match_score >= 60 ? "text-emerald-400" : "text-amber-400"}`}>
                    {company.match_score >= 60 ? "fit" : "target"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
              No matches yet
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  index,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  sub: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      className="p-4 rounded-xl glass"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold truncate">{value}</p>
      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{sub}</p>
    </motion.div>
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
    { title: "Complete Onboarding", desc: "Set up your profile with skills and goals", href: "/onboarding", done: onboardingComplete },
    { title: "Run AI Analysis", desc: "Let AI analyze your placement readiness", href: "/companies", done: hasAnalysis },
    { title: "Get Company Matches", desc: "See which companies match your profile", href: "/companies", done: hasRecommendations },
    { title: "Generate Task Plan", desc: "Get a personalized weekly preparation plan", href: "/tasks", done: hasTasks },
  ];

  const nextStep = steps.find(s => !s.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Welcome, {name?.split(" ")[0] || "Student"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {onboardingComplete
            ? "Your profile is set up! Now let's analyze your skills."
            : "Let's get you started on your career journey"}
        </p>
      </div>

      <div className="p-6 rounded-xl glass">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Getting Started
        </h2>
        <div className="space-y-1">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => !step.done && router.push(step.href)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors text-left ${
                step.done ? "opacity-50 cursor-default" : "hover:bg-white/[0.02] cursor-pointer"
              }`}
            >
              {step.done ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
              )}
              <div className="flex-1">
                <p className={`font-medium text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {!step.done && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </div>

      {nextStep && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl glass border border-primary/15"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Next: {nextStep.title}</p>
              <p className="text-xs text-muted-foreground">{nextStep.desc}</p>
            </div>
            <Button
              onClick={() => router.push(nextStep.href)}
              className="gradient-primary text-white border-0 gap-2 hover:opacity-90"
            >
              Go <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 rounded-xl glass">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-3" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <div className="md:col-span-3 grid gap-3 grid-cols-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl glass">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
