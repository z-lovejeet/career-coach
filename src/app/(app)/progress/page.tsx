"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import {
  Flame,
  Star,
  Trophy,
  Zap,
  Target,
  CheckCircle2,
  Mic,
  Brain,
  TrendingUp,
  Calendar,
  Award,
  Lock,
  Code2,
  Globe,
  Server,
  Users,
  FolderKanban,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface StreakData {
  streak: { current: number; longest: number };
  xp: {
    total: number;
    level: number;
    xpProgress: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    breakdown: { tasks: number; interviews: number; analyses: number; streakBonus: number };
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalInterviews: number;
    completedInterviews: number;
    totalAnalyses: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    desc: string;
    icon: string;
    unlocked: boolean;
  }>;
  heatmap: Array<{ date: string; count: number }>;
  categoryBreakdown: Record<string, { total: number; completed: number }>;
}

const categoryConfig: Record<string, { icon: typeof Code2; label: string; color: string }> = {
  dsa: { icon: Code2, label: "DSA", color: "text-violet-400" },
  web_dev: { icon: Globe, label: "Web Dev", color: "text-blue-400" },
  system_design: { icon: Server, label: "System Design", color: "text-amber-400" },
  soft_skills: { icon: Users, label: "Soft Skills", color: "text-emerald-400" },
  project: { icon: FolderKanban, label: "Project", color: "text-rose-400" },
  other: { icon: BarChart3, label: "Other", color: "text-gray-400" },
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProgressPage() {
  const { data: json, isLoading: loading } = useSWR('/api/streak', fetcher);
  const data: StreakData | null = json?.success ? json.data : null;

  if (loading) return <ProgressSkeleton />;
  if (!data && !loading) return <div className="text-center py-20 text-muted-foreground">Failed to load progress data.</div>;
  if (!data) return <ProgressSkeleton />;

  const { streak, xp, stats, achievements, heatmap, categoryBreakdown } = data;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your growth, maintain streaks, and unlock achievements
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Streak Card */}
        <motion.div
          className="p-5 rounded-2xl glass-strong text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
          <div className="relative">
            <div className="text-4xl mb-1">🔥</div>
            <p className="text-4xl font-bold text-orange-400">{streak.current}</p>
            <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Best: {streak.longest} days
            </p>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div
          className="p-5 rounded-2xl glass-strong text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5" />
          <div className="relative">
            <div className="text-4xl mb-1">⚡</div>
            <p className="text-4xl font-bold text-violet-400">Lvl {xp.level}</p>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{xp.total} XP</span>
                <span>{xp.xpForNextLevel} XP</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${xp.xpProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tasks Card */}
        <motion.div
          className="p-5 rounded-2xl glass-strong text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5" />
          <div className="relative">
            <div className="text-4xl mb-1">✅</div>
            <p className="text-4xl font-bold text-emerald-400">{stats.completedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">Tasks Done</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              of {stats.totalTasks} total
            </p>
          </div>
        </motion.div>

        {/* Achievements Card */}
        <motion.div
          className="p-5 rounded-2xl glass-strong text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5" />
          <div className="relative">
            <div className="text-4xl mb-1">🏆</div>
            <p className="text-4xl font-bold text-amber-400">{unlockedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Achievements</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              of {achievements.length} total
            </p>
          </div>
        </motion.div>
      </div>

      {/* XP Breakdown */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-amber-400" />
          XP Breakdown
          <Badge variant="outline" className="text-[10px] ml-auto">
            {xp.total} total XP
          </Badge>
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <XPRow label="Tasks" value={xp.breakdown.tasks} icon="📝" color="text-emerald-400" />
          <XPRow label="Interviews" value={xp.breakdown.interviews} icon="🎤" color="text-blue-400" />
          <XPRow label="Analyses" value={xp.breakdown.analyses} icon="🧠" color="text-violet-400" />
          <XPRow label="Streak Bonus" value={xp.breakdown.streakBonus} icon="🔥" color="text-orange-400" />
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          Activity (Last 90 Days)
        </h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-[3px] flex-wrap" style={{ maxWidth: "100%" }}>
            {heatmap.map((day, i) => {
              const intensity =
                day.count === 0
                  ? "bg-muted/50"
                  : day.count === 1
                  ? "bg-emerald-500/30"
                  : day.count <= 3
                  ? "bg-emerald-500/50"
                  : day.count <= 5
                  ? "bg-emerald-500/70"
                  : "bg-emerald-500";

              const date = new Date(day.date);
              const tooltip = `${date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}: ${day.count} activities`;

              return (
                <motion.div
                  key={day.date}
                  className={`w-3.5 h-3.5 rounded-sm ${intensity} cursor-pointer transition-all hover:ring-1 hover:ring-primary/50`}
                  title={tooltip}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.003 }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted/50" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>More</span>
          </div>
        </div>
      </motion.div>

      {/* Skill Category Progress */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" />
          Skill Category Progress
        </h2>
        <div className="space-y-4">
          {Object.entries(categoryBreakdown).map(([cat, data]) => {
            const config = categoryConfig[cat] || categoryConfig.other;
            const CatIcon = config.icon;
            const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CatIcon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {data.completed}/{data.total} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full`}
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--primary)), #22d3ee)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(categoryBreakdown).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Complete tasks to see your category progress here.
            </p>
          )}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-amber-400" />
          Achievements
          <Badge variant="outline" className="text-[10px] ml-auto">
            {unlockedCount}/{achievements.length} unlocked
          </Badge>
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((achievement, i) => (
            <motion.div
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all ${
                achievement.unlocked
                  ? "glass-strong border-amber-500/20"
                  : "bg-muted/20 border-border/50 opacity-50"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{achievement.unlocked ? achievement.icon : "🔒"}</span>
              </div>
              <p className="font-medium text-sm">{achievement.title}</p>
              <p className="text-[11px] text-muted-foreground">{achievement.desc}</p>
              {achievement.unlocked && (
                <Badge className="mt-2 bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px]">
                  Unlocked
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4 text-primary" />
          Quick Stats
        </h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <QuickStat label="Tasks Created" value={stats.totalTasks} icon="📋" />
          <QuickStat label="Tasks Completed" value={stats.completedTasks} icon="✅" />
          <QuickStat label="Interviews" value={stats.completedInterviews} icon="🎤" />
          <QuickStat label="AI Analyses" value={stats.totalAnalyses} icon="🧠" />
        </div>
      </motion.div>
    </div>
  );
}

function XPRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-accent/30 text-center">
      <span className="text-xl">{icon}</span>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-accent/20">
      <span className="text-2xl">{icon}</span>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
