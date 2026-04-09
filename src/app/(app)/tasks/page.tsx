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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  dsa: { icon: Code2, label: "DSA", color: "text-violet-400 bg-violet-500/15 border-violet-500/20" },
  web_dev: { icon: Globe, label: "Web Dev", color: "text-blue-400 bg-blue-500/15 border-blue-500/20" },
  system_design: { icon: Server, label: "System Design", color: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
  soft_skills: { icon: Users, label: "Soft Skills", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20" },
  project: { icon: FolderKanban, label: "Project", color: "text-rose-400 bg-rose-500/15 border-rose-500/20" },
  other: { icon: BarChart3, label: "Other", color: "text-gray-400 bg-gray-500/15 border-gray-500/20" },
};

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400 border-emerald-500/20",
  medium: "text-amber-400 border-amber-500/20",
  hard: "text-rose-400 border-rose-500/20",
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
      toast.info("🧠 AI is generating your weekly plan...");
      const res = await fetch("/api/tasks/generate", { method: "POST" });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to generate");
      }

      toast.success(`✅ Week ${data.data.week_number} plan: ${data.data.theme}`);
      await fetchTasks();
    } catch (err) {
      console.error("Generate error:", err);
      toast.error("Failed to generate tasks. Make sure you've run analysis first.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const newCompleted = !task.completed;
    
    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t)
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      if (newCompleted) {
        toast.success(`✅ "${task.title}" completed!`);
      }
    } catch {
      // Revert on failure
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, completed: !newCompleted } : t)
      );
      toast.error("Failed to update task");
    }
  };

  // Get unique weeks
  const weeks = [...new Set(tasks.map(t => t.week_number))].sort((a, b) => (b || 0) - (a || 0));
  const latestWeek = weeks[0];

  // Filter tasks
  let filteredTasks = tasks;
  if (weekFilter === "latest" && latestWeek) {
    filteredTasks = filteredTasks.filter(t => t.week_number === latestWeek);
  } else if (weekFilter !== "all") {
    filteredTasks = filteredTasks.filter(t => t.week_number === parseInt(weekFilter));
  }
  if (filter !== "all") {
    filteredTasks = filteredTasks.filter(t => t.category === filter);
  }

  // Stats
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group by day
  const tasksByDay: Record<number, Task[]> = {};
  filteredTasks.forEach(t => {
    const day = t.day_number || 0;
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(t);
  });
  const sortedDays = Object.keys(tasksByDay).map(Number).sort((a, b) => a - b);

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (tasks.length === 0) {
    return <EmptyState generating={generating} onGenerate={generateTasks} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Tasks</h1>
          <p className="text-muted-foreground">
            Week {latestWeek || 1} — {completedTasks}/{totalTasks} completed
          </p>
        </div>
        <Button
          onClick={generateTasks}
          disabled={generating}
          className="gradient-primary text-white border-0 gap-2 hover:opacity-90"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Generate Next Week
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl glass">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Weekly Progress</span>
          <span className="text-sm font-bold text-primary">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = filteredTasks.filter(t => t.category === key).length;
            if (count === 0) return null;
            const done = filteredTasks.filter(t => t.category === key && t.completed).length;
            return (
              <span key={key} className="flex items-center gap-1">
                <span className={config.color.split(" ")[0]}>●</span>
                {config.label}: {done}/{count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filter} onValueChange={(v) => setFilter(v || "all")}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {weeks.length > 1 && (
          <Select value={weekFilter} onValueChange={(v) => setWeekFilter(v || "latest")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Week</SelectItem>
              <SelectItem value="all">All Weeks</SelectItem>
              {weeks.map(w => (
                <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tasks grouped by day */}
      <div className="space-y-6">
        {sortedDays.map(day => (
          <div key={day}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {dayNames[day] || `Day ${day}`}
              <Badge variant="outline" className="text-[10px]">
                {tasksByDay[day].filter(t => t.completed).length}/{tasksByDay[day].length}
              </Badge>
            </h3>
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
  const diffColor = difficultyColors[task.difficulty] || difficultyColors.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className={`group p-4 rounded-xl border transition-all duration-200 ${
        task.completed
          ? "bg-accent/30 border-border/50 opacity-60"
          : "glass hover:glass-strong"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm leading-snug ${
              task.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`text-[10px] ${config.color}`}>
              <CategoryIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${diffColor}`}>
              {task.difficulty}
            </Badge>
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
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-6 animate-float">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No Tasks Yet</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Generate your first weekly plan. The AI will create personalized tasks
        based on your profile analysis and company targets.
      </p>
      <Button
        size="lg"
        onClick={onGenerate}
        disabled={generating}
        className="gradient-primary text-white border-0 gap-2 hover:opacity-90 glow"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating plan...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Week 1 Plan
          </>
        )}
      </Button>
      {generating && (
        <p className="text-sm text-muted-foreground mt-4 animate-pulse">
          AI Planner Agent is creating your personalized tasks...
        </p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="p-4 rounded-xl glass">
        <Skeleton className="h-2 w-full mb-3" />
        <Skeleton className="h-3 w-64" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl glass">
          <div className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
