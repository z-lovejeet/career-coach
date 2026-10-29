"use client";

import useSWR from "swr";
import {
  Trophy,
  Zap,
  TrendingUp,
  Calendar,
  Code2,
  Globe,
  Server,
  Users,
  FolderKanban,
  BarChart3,
  Flame,
  Star,
  CheckCircle2,
} from "lucide-react";
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
  dsa: { icon: Code2, label: "DSA", color: "text-blue-400" },
  web_dev: { icon: Globe, label: "Web Dev", color: "text-emerald-400" },
  system_design: { icon: Server, label: "System Design", color: "text-amber-400" },
  soft_skills: { icon: Users, label: "Soft Skills", color: "text-purple-400" },
  project: { icon: FolderKanban, label: "Project", color: "text-rose-400" },
  other: { icon: BarChart3, label: "Other", color: "text-slate-400" },
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProgressPage() {
  const { data: json, isLoading: loading } = useSWR('/api/streak', fetcher);
  const data: StreakData | null = json?.success ? json.data : null;

  if (loading) return <ProgressSkeleton />;
  if (!data && !loading) return <div className="text-center py-20 text-muted-foreground font-mono">Failed to load progress telemetry.</div>;
  if (!data) return <ProgressSkeleton />;

  const { streak, xp, stats, achievements, heatmap, categoryBreakdown } = data;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              Telemetry & Growth
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-[11px] text-muted-foreground">Placement Calibration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Performance & Mastery
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
          <Star className="w-3.5 h-3.5 text-blue-400" />
          <span>Level {xp.level} Engineer • {xp.total} XP</span>
        </div>
      </div>

      {/* ─── Top 4 Metric Cards (Double Bezel) ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Streak */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="p-5 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-2.5 text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight text-orange-400">{streak.current}</p>
            <p className="text-xs font-mono text-slate-300 mt-1 uppercase">Day Streak</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Record: {streak.longest} days</p>
          </div>
        </div>

        {/* Level / XP */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="p-5 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-2.5 text-blue-400">
              <Star className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight text-blue-400">Lvl {xp.level}</p>
            <div className="mt-2">
              <div className="h-1.5 bg-[#08090D] rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  style={{ width: `${xp.xpProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-1.5">{xp.total} / {xp.xpForNextLevel} XP</p>
            </div>
          </div>
        </div>

        {/* Tasks Verified */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="p-5 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2.5 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight text-emerald-400">{stats.completedTasks}</p>
            <p className="text-xs font-mono text-slate-300 mt-1 uppercase">Tasks Completed</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">of {stats.totalTasks} scheduled</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="p-5 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight text-amber-400">{unlockedCount}</p>
            <p className="text-xs font-mono text-slate-300 mt-1 uppercase">Unlocked Badges</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">of {achievements.length} achievements</p>
          </div>
        </div>
      </div>

      {/* ─── 90-Day Activity Heatmap (Doppelrand) ─── */}
      <div className="p-1.5 rounded-3xl bg-white/[0.04] border border-white/10">
        <div className="p-6 rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16]">
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              90-Day Engineering Activity Heatmap
            </h3>
            <span className="font-mono text-[10px] text-slate-500">REAL-TIME COMMITS</span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-[4px] flex-wrap max-w-full">
              {heatmap.map((day) => {
                const intensity =
                  day.count === 0
                    ? "bg-white/[0.03] border border-white/[0.03]"
                    : day.count === 1
                    ? "bg-emerald-500/30 border border-emerald-500/40"
                    : day.count <= 3
                    ? "bg-emerald-500/60 border border-emerald-500/70"
                    : "bg-emerald-400 border border-emerald-300";

                const date = new Date(day.date);
                const tooltip = `${date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}: ${day.count} activities`;

                return (
                  <div
                    key={day.date}
                    className={`w-3.5 h-3.5 rounded-sm ${intensity} transition-all hover:scale-125 cursor-pointer`}
                    title={tooltip}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] font-mono text-slate-400">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-white/[0.03] border border-white/[0.03]" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-500/70" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400" />
              <span>More Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Domain Progress & XP Breakdown Split ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Domain Mastery Breakdown */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="p-6 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16]">
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Domain Mastery Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([cat, d]) => {
                const config = categoryConfig[cat] || categoryConfig.other;
                const CatIcon = config.icon;
                const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <CatIcon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span className="text-slate-200">{config.label}</span>
                      </div>
                      <span className="text-slate-400">{d.completed}/{d.total} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-[#08090D] rounded-full overflow-hidden border border-white/[0.06]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* XP Sources Matrix */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="p-6 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16]">
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Telemetry XP Attribution
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.06] text-center">
                <span className="text-lg">📝</span>
                <p className="font-mono text-xl font-bold text-emerald-400 mt-1">{xp.breakdown.tasks}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Tasks XP</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.06] text-center">
                <span className="text-lg">🎤</span>
                <p className="font-mono text-xl font-bold text-blue-400 mt-1">{xp.breakdown.interviews}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Interviews XP</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.06] text-center">
                <span className="text-lg">🧠</span>
                <p className="font-mono text-xl font-bold text-purple-400 mt-1">{xp.breakdown.analyses}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Analyses XP</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/[0.06] text-center">
                <span className="text-lg">🔥</span>
                <p className="font-mono text-xl font-bold text-orange-400 mt-1">{xp.breakdown.streakBonus}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Streak Bonus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Achievements Matrix ─── */}
      <div className="p-1.5 rounded-3xl bg-white/[0.04] border border-white/10">
        <div className="p-6 rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16]">
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Candidate Placement Badges
            </h3>
            <span className="font-mono text-[10px] text-amber-400">
              {unlockedCount} / {achievements.length} UNLOCKED
            </span>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all ${
                  ach.unlocked
                    ? "bg-[#0F121D] border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)]"
                    : "bg-[#08090D] border-white/[0.04] opacity-40"
                }`}
              >
                <div className="text-2xl mb-2">{ach.unlocked ? ach.icon : "🔒"}</div>
                <p className="font-semibold text-xs text-white">{ach.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{ach.desc}</p>
                {ach.unlocked && (
                  <span className="mt-2 inline-block font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Unlocked
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Skeleton className="h-8 w-48 bg-white/[0.04]" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-3xl bg-white/[0.04]" />
    </div>
  );
}
