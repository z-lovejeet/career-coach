"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Loader2,
  Plus,
  Sparkles,
  Code2,
  Globe,
  Server,
  Users,
  FolderKanban,
  BarChart3,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Task } from "@/types";

const categoryConfig: Record<string, { icon: typeof Code2; label: string; color: string }> = {
  dsa: { icon: Code2, label: "DSA", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  web_dev: { icon: Globe, label: "Web Dev", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  system_design: { icon: Server, label: "System Design", color: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  soft_skills: { icon: Users, label: "Soft Skills", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  project: { icon: FolderKanban, label: "Project", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  other: { icon: BarChart3, label: "Other", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  medium: "text-amber-300 border-amber-500/20 bg-amber-500/5",
  hard: "text-rose-400 border-rose-500/20 bg-rose-500/5",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("latest");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    setGenerating(true);
    try {
      toast.info("Synthesizing next week's calibration plan via Groq 120B...");
      const res = await fetch("/api/tasks/generate", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to generate");
      }

      toast.success(`Week ${data.data.week_number} plan generated: ${data.data.theme}`);
      await fetchTasks();
    } catch (err) {
      console.error("Generate error:", err);
      toast.error("Failed to generate tasks. Please run analysis first.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const newCompleted = !task.completed;
    
    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t)
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });

      if (!res.ok) throw new Error("Failed to update");

      if (newCompleted) {
        toast.success(`"${task.title}" completed! XP added.`);
      }
    } catch {
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, completed: !newCompleted } : t)
      );
      toast.error("Failed to update task status");
    }
  };

  const weeks = [...new Set(tasks.map(t => t.week_number))].sort((a, b) => (b || 0) - (a || 0));
  const latestWeek = weeks[0];

  let filteredTasks = tasks;
  if (weekFilter === "latest" && latestWeek) {
    filteredTasks = filteredTasks.filter(t => t.week_number === latestWeek);
  } else if (weekFilter !== "all") {
    filteredTasks = filteredTasks.filter(t => t.week_number === parseInt(weekFilter));
  }
  if (filter !== "all") {
    filteredTasks = filteredTasks.filter(t => t.category === filter);
  }

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tasksByDay: Record<number, Task[]> = {};
  filteredTasks.forEach(t => {
    const day = t.day_number || 0;
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(t);
  });
  const sortedDays = Object.keys(tasksByDay).map(Number).sort((a, b) => a - b);
  const dayNames = ["", "Monday Sprint", "Tuesday Sprint", "Wednesday Sprint", "Thursday Sprint", "Friday Sprint", "Saturday Sprint", "Sunday Review"];

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (tasks.length === 0) {
    return <EmptyState generating={generating} onGenerate={generateTasks} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
              Active Sprint
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">Week {latestWeek || 1} Curriculum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Daily Preparation Tasks
          </h1>
        </div>

        <Button
          onClick={generateTasks}
          disabled={generating}
          className="h-9 px-4 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Synthesizing...
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Generate Next Week
            </>
          )}
        </Button>
      </div>

      {/* ─── Sprint Progress Overview ─── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A96AA]">Sprint Completion Index</span>
            <p className="text-sm font-semibold text-white mt-0.5">
              <span className="tabular-nums">{completedTasks}</span> of <span className="tabular-nums">{totalTasks}</span> tasks verified complete
            </p>
          </div>
          <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
            {completionRate}%
          </span>
        </div>

        <div className="h-2 bg-[#0A0C13] rounded-full overflow-hidden border border-white/[0.06]">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/[0.06] text-xs font-mono">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = filteredTasks.filter(t => t.category === key).length;
            if (count === 0) return null;
            const done = filteredTasks.filter(t => t.category === key && t.completed).length;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${config.color.split(" ")[0].replace("text-", "bg-")}`} />
                <span className="text-[#8A96AA]">{config.label}:</span>
                <span className="text-white font-semibold tabular-nums">{done}/{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filter} onValueChange={(v) => setFilter(v || "all")}>
          <SelectTrigger className="w-[180px] h-9 bg-[#0E111A] border-white/[0.1] rounded-lg text-xs font-mono text-slate-300">
            <Filter className="w-3.5 h-3.5 mr-2 text-blue-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0E111A] border-white/[0.1] text-white text-xs font-mono">
            <SelectItem value="all">All Domains</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {weeks.length > 1 && (
          <Select value={weekFilter} onValueChange={(v) => setWeekFilter(v || "latest")}>
            <SelectTrigger className="w-[150px] h-9 bg-[#0E111A] border-white/[0.1] rounded-lg text-xs font-mono text-slate-300">
              <Calendar className="w-3.5 h-3.5 mr-2 text-emerald-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0E111A] border-white/[0.1] text-white text-xs font-mono">
              <SelectItem value="latest">Latest Week</SelectItem>
              <SelectItem value="all">All Sprints</SelectItem>
              {weeks.map(w => (
                <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ─── Tasks Grouped by Day ─── */}
      <div className="space-y-5">
        {sortedDays.map(day => (
          <div key={day} className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/[0.06]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {dayNames[day] || `Day ${day}`}
              </h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[#8A96AA] border border-white/[0.06] tabular-nums">
                {tasksByDay[day].filter(t => t.completed).length} / {tasksByDay[day].length} Done
              </span>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {tasksByDay[day].map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task)}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  index,
}: {
  task: Task;
  onToggle: () => void;
  index: number;
}) {
  const config = categoryConfig[task.category] || categoryConfig.other;
  const CategoryIcon = config.icon;
  const diffClass = difficultyColors[task.difficulty] || difficultyColors.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ delay: index * 0.02 }}
      className={`p-3.5 rounded-lg border transition-all ${
        task.completed
          ? "bg-[#0A0C13] border-white/[0.04] opacity-45"
          : "bg-[#0A0C13] border-white/[0.06] hover:border-white/[0.14]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90 p-0.5 cursor-pointer"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-[#64748B] hover:text-blue-400 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-xs sm:text-sm font-medium leading-snug ${
              task.completed ? "line-through text-[#64748B]" : "text-white"
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-[#8A96AA] mt-1 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 font-mono text-[10px]">
            <span className={`px-2 py-0.5 rounded border flex items-center gap-1 ${config.color}`}>
              <CategoryIcon className="w-3 h-3" />
              {config.label}
            </span>
            <span className={`px-2 py-0.5 rounded border uppercase ${diffClass}`}>
              {task.difficulty}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({
  generating,
  onGenerate,
}: {
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5 text-blue-400 shadow-sm">
        <Layers className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">No Active Sprint Plan</h2>
      <p className="text-xs sm:text-sm text-[#8A96AA] max-w-md mx-auto mb-6 leading-relaxed font-sans">
        Synthesize your first customized weekly curriculum. Groq 120B will inspect your dossier gaps and schedule daily targeted problem sets.
      </p>
      <Button
        onClick={onGenerate}
        disabled={generating}
        className="h-10 px-6 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm transition-all cursor-pointer"
      >
        {generating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Synthesizing Week 1 Plan...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Week 1 Sprint
          </span>
        )}
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-28 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
