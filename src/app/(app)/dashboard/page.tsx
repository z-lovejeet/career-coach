"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  Code2,
  BarChart3,
  ArrowRight,
  Loader2,
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    analysis: null,
    tasks: [],
    recommendations: null,
    profile: null,
    streakInfo: null,
  });
  const [alerts, setAlerts] = useState<AgenticAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboard();
    fetchAlerts();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts/check");
      const result = await res.json();
      if (result.success) setAlerts(result.data.alerts);
    } catch { /* silent */ }
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set(prev).add(id));
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  if (loading) {
    return <DashboardSkeleton />;
  }

  // If no analysis yet, show getting started
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

  // Category breakdown
  const categories = ["dsa", "web_dev", "system_design", "soft_skills", "project"];
  const categoryLabels: Record<string, string> = {
    dsa: "DSA", web_dev: "Web Dev", system_design: "Sys Design", soft_skills: "Soft Skills", project: "Project"
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {data.profile?.full_name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your career preparation overview
          </p>
        </div>
        {data.streakInfo && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{data.streakInfo.streak.current}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-violet-500/20">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold text-violet-400">Lvl {data.streakInfo.xp.level}</span>
            </div>
          </div>
        )}
      </div>

      {/* 🤖 AGENTIC ALERTS — Proactive AI Interventions */}
      {visibleAlerts.length > 0 && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">AI Coach Alerts</span>
            <Badge variant="outline" className="text-[10px]">{visibleAlerts.length}</Badge>
          </div>
          {visibleAlerts.slice(0, 3).map((alert) => {
            const borderColor = alert.type === 'critical' ? 'border-red-500/30 bg-red-500/5'
              : alert.type === 'warning' ? 'border-amber-500/30 bg-amber-500/5'
              : alert.type === 'action' ? 'border-primary/30 bg-primary/5'
              : 'border-border/50 bg-accent/20';
            return (
              <motion.div
                key={alert.id}
                className={`p-3 rounded-xl border ${borderColor} flex items-start gap-3`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  {alert.action && (
                    <Button
                      size="sm"
                      variant={alert.type === 'critical' ? 'default' : 'outline'}
                      className="mt-2 h-7 text-xs"
                      onClick={() => router.push(alert.action!.href)}
                    >
                      {alert.action.label}
                    </Button>
                  )}
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Score + Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Readiness Score */}
        <motion.div
          className="md:col-span-1 p-6 rounded-2xl glass-strong text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative w-28 h-28 mx-auto mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#scoreGradient)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - analysis.readiness_score / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{analysis.readiness_score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className="text-sm font-medium">Readiness Score</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analysis.readiness_score >= 70 ? "Great progress!" : analysis.readiness_score >= 40 ? "Keep going!" : "Let's improve!"}
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="md:col-span-3 grid gap-4 grid-cols-2 sm:grid-cols-3">
          <StatCard
            icon={CheckCircle2}
            label="Tasks Done"
            value={`${completedTasks}/${totalTasks}`}
            sub={`${completionRate}% completion`}
            color="text-emerald-400 bg-emerald-500/15"
            index={0}
          />
          <StatCard
            icon={Building2}
            label="Company Matches"
            value={String(currentFit.length + targets.length)}
            sub={`${currentFit.length} current fit`}
            color="text-blue-400 bg-blue-500/15"
            index={1}
          />
          <StatCard
            icon={TrendingUp}
            label="Strengths"
            value={String(analysis.strengths.length)}
            sub={analysis.strengths[0]?.skill || "—"}
            color="text-violet-400 bg-violet-500/15"
            index={2}
          />
          <StatCard
            icon={Target}
            label="Skill Gaps"
            value={String(analysis.missing_skills.length)}
            sub={analysis.missing_skills[0]?.skill || "None!"}
            color="text-amber-400 bg-amber-500/15"
            index={3}
          />
          <StatCard
            icon={Code2}
            label="Skills"
            value={String(analysis.extracted_skills.length)}
            sub="Identified by AI"
            color="text-cyan-400 bg-cyan-500/15"
            index={4}
          />
          <StatCard
            icon={Zap}
            label="Top Target"
            value={targets[0]?.name || "—"}
            sub={targets[0] ? `${targets[0].match_score}% match` : "Run analysis"}
            color="text-rose-400 bg-rose-500/15"
            index={5}
          />
        </div>
      </div>

      {/* AI Summary */}
      <motion.div
        className="p-5 rounded-2xl glass-strong"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Assessment</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
      </motion.div>

      {/* Two Column: Tasks + Companies */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Today&apos;s Tasks
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="text-xs gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    task.completed ? "opacity-50" : "hover:bg-accent/50"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm flex-1 truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No tasks yet. Go to Tasks to generate your plan.
            </div>
          )}
        </motion.div>

        {/* Top Companies */}
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Top Company Matches
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/companies")} className="text-xs gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          {currentFit.length > 0 || targets.length > 0 ? (
            <div className="space-y-2">
              {[...currentFit.slice(0, 3), ...targets.slice(0, 2)].map((company, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {company.match_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{company.role}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      company.match_score >= 60
                        ? "text-emerald-400 border-emerald-500/20"
                        : "text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {company.match_score >= 60 ? "fit" : "target"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Go to Companies to get AI recommendations.
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold truncate">{value}</p>
      <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
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

  // Find next uncompleted step
  const nextStep = steps.find(s => !s.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">
          Welcome, {name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="text-muted-foreground">
          {onboardingComplete
            ? "Your profile is set up! Now let\u0027s analyze your skills."
            : "Let\u0027s get you started on your career journey"}
        </p>
      </div>

      <div className="p-6 rounded-2xl glass-strong">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Getting Started
        </h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => !step.done && router.push(step.href)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors text-left ${
                step.done
                  ? "opacity-60 cursor-default"
                  : "hover:bg-accent/50 cursor-pointer"
              }`}
            >
              {step.done ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
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

      {/* Quick action for next step */}
      {nextStep && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl glass border border-primary/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Next Step: {nextStep.title}</p>
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
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 rounded-2xl glass">
          <Skeleton className="w-28 h-28 rounded-full mx-auto mb-3" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <div className="md:col-span-3 grid gap-4 grid-cols-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl glass">
              <Skeleton className="w-8 h-8 rounded-lg mb-2" />
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
