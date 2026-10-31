"use client";

import { useState, useEffect } from "react";
import { useLocalStorage } from "react-use";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  Target,
  Clock,
  BookOpen,
  Code2,
  Brain,
  GraduationCap,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  Flame,
  Shield,
  ArrowRight,
  RotateCcw,
  Building2,
  Star,
  CircleDot,
  ExternalLink,
  Video,
  FileText,
  Wrench,
  Newspaper,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

/* ─── Types ─── */
interface Task {
  title: string;
  type: string;
  description: string;
  resources: string[];
  deliverable: string;
}

interface StudyResource {
  title: string;
  url: string;
  type: 'youtube' | 'youtube_playlist' | 'documentation' | 'course' | 'practice' | 'article' | 'tool';
  description: string;
}

interface Week {
  weekNumber: number;
  focus: string;
  dailyHoursBreakdown: { theory: number; practice: number; projects: number };
  tasks: Task[];
  weeklyGoal: string;
}

interface Phase {
  phaseNumber: number;
  title: string;
  startWeek: number;
  endWeek: number;
  objective: string;
  milestone: string;
  resources?: StudyResource[];
  weeks: Week[];
}

interface SkillGap {
  skill: string;
  currentLevel: string;
  targetLevel: string;
  estimatedWeeks: number;
  priority: string;
}

interface Roadmap {
  overview: {
    feasibility: string;
    feasibilityNote: string;
    alternativeCompanies?: string[];
    currentReadiness: number;
    targetReadiness: number;
    estimatedFinalReadiness: number;
  };
  phases: Phase[];
  keySkillsToAcquire: SkillGap[];
  interviewPrep: {
    dsaProblemsTarget: number;
    systemDesignTopics: string[];
    mockInterviewsTarget: number;
    companySpecificTips: string[];
  };
  warnings: string[];
}

/* ─── Constants ─── */
const FOCUS_OPTIONS = [
  { id: "dsa", label: "DSA & Problem Solving", icon: Code2 },
  { id: "web_dev", label: "Web Development", icon: BookOpen },
  { id: "system_design", label: "System Design", icon: Brain },
  { id: "projects", label: "Projects & Portfolio", icon: Target },
  { id: "soft_skills", label: "Soft Skills & Communication", icon: GraduationCap },
  { id: "mock_interviews", label: "Mock Interviews", icon: Mic },
];

const POPULAR_COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple",
  "Flipkart", "Goldman Sachs", "Morgan Stanley",
  "Atlassian", "Uber", "Swiggy", "Razorpay",
  "TCS", "Infosys", "Wipro", "Cognizant",
];

const typeIcons: Record<string, typeof Code2> = {
  dsa: Code2,
  web_dev: BookOpen,
  system_design: Brain,
  project: Target,
  soft_skills: GraduationCap,
  revision: RotateCcw,
  mock_interview: Mic,
};

const typeColors: Record<string, string> = {
  dsa: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  web_dev: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  system_design: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  project: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  soft_skills: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  revision: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  mock_interview: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const priorityColors: Record<string, string> = {
  critical: "text-rose-400 border-rose-500/25 bg-rose-500/10",
  high: "text-amber-300 border-amber-500/25 bg-amber-500/10",
  medium: "text-blue-400 border-blue-500/25 bg-blue-500/10",
  low: "text-slate-400 border-slate-500/25 bg-slate-500/10",
};

const feasibilityConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  realistic: { color: "text-emerald-400", icon: CheckCircle2, label: "Achievable" },
  ambitious: { color: "text-amber-300", icon: Zap, label: "Ambitious" },
  unrealistic: { color: "text-rose-400", icon: AlertTriangle, label: "Very Challenging" },
};

const resourceTypeConfig: Record<string, { icon: typeof Video; color: string; label: string }> = {
  youtube_playlist: { icon: Video, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "YT Playlist" },
  youtube: { icon: Video, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "YouTube" },
  documentation: { icon: FileText, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", label: "Docs" },
  course: { icon: GraduationCap, color: "text-purple-400 bg-purple-500/10 border-purple-500/20", label: "Course" },
  practice: { icon: Dumbbell, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Practice" },
  article: { icon: Newspaper, color: "text-amber-300 bg-amber-500/10 border-amber-500/20", label: "Article" },
  tool: { icon: Wrench, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", label: "Tool" },
};

export default function RoadmapPage() {
  const [dreamCompany, setDreamCompany] = useLocalStorage("roadmap_dreamCompany", "");
  const [targetRole, setTargetRole] = useLocalStorage("roadmap_targetRole", "Software Engineer");
  const [timelineMonths, setTimelineMonths] = useLocalStorage("roadmap_timelineMonths", 3);
  const [hoursPerDay, setHoursPerDay] = useLocalStorage("roadmap_hoursPerDay", 4);
  const [focusAreas, setFocusAreas] = useLocalStorage<string[]>("roadmap_focusAreas", ["dsa", "web_dev"]);
  
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useLocalStorage<Roadmap | null>("career_ai_roadmap", null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!roadmap) {
      fetch("/api/roadmap")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setRoadmap(data.data);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFocus = (id: string) => {
    setFocusAreas((prev) => {
      const current = prev || [];
      return current.includes(id) ? current.filter((f) => f !== id) : [...current, id];
    });
  };

  const generateRoadmap = async () => {
    if (!dreamCompany?.trim()) {
      toast.error("Please enter your dream company!");
      return;
    }
    if (!focusAreas || focusAreas.length === 0) {
      toast.error("Select at least one focus area!");
      return;
    }

    setGenerating(true);
    try {
      toast.info("Synthesizing your personalized roadmap via Groq 120B...");
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamCompany,
          targetRole,
          timelinMonths: timelineMonths,
          hoursPerDay,
          focusAreas,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      
      const raw = data.data;
      const normalized: Roadmap = {
        overview: {
          feasibility: raw.overview?.feasibility || 'ambitious',
          feasibilityNote: raw.overview?.feasibilityNote || '',
          alternativeCompanies: raw.overview?.alternativeCompanies || [],
          currentReadiness: raw.overview?.currentReadiness || 0,
          targetReadiness: raw.overview?.targetReadiness || 80,
          estimatedFinalReadiness: raw.overview?.estimatedFinalReadiness || 0,
        },
        phases: (raw.phases || []).map((p: Phase) => ({
          ...p,
          resources: p.resources || [],
          weeks: (p.weeks || []).map((w: Week) => ({
            ...w,
            tasks: w.tasks || [],
            dailyHoursBreakdown: w.dailyHoursBreakdown || { theory: 1, practice: 2, projects: 0 },
          })),
        })),
        keySkillsToAcquire: raw.keySkillsToAcquire || [],
        interviewPrep: {
          dsaProblemsTarget: raw.interviewPrep?.dsaProblemsTarget || 0,
          systemDesignTopics: raw.interviewPrep?.systemDesignTopics || [],
          mockInterviewsTarget: raw.interviewPrep?.mockInterviewsTarget || 0,
          companySpecificTips: raw.interviewPrep?.companySpecificTips || [],
        },
        warnings: raw.warnings || [],
      };
      
      if (normalized.phases.length === 0) {
        toast.error("Roadmap generated without phases. Please try again.");
        return;
      }

      setRoadmap(normalized);
      setExpandedPhase(0);
      toast.success("Roadmap generated! Explore your week-by-week plan.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to generate roadmap. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-44 rounded-md bg-white/[0.04] animate-pulse" />
        <div className="h-64 rounded-xl bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
              Autonomous Curriculum
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">Socratic Progression</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Preparation Roadmap
          </h1>
        </div>
      </div>

      {/* Input Form */}
      <motion.div
        className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 space-y-5 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Configure Your Prep Trajectory
          </h2>
          <span className="font-mono text-[10px] text-[#8A96AA]">ENGINE: GROQ 120B</span>
        </div>

        {/* Dream Company */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-[#8A96AA] mb-1.5 block">
            Target Organization
          </label>
          <input
            value={dreamCompany || ""}
            onChange={(e) => setDreamCompany(e.target.value)}
            placeholder="e.g., Google, Stripe, Uber, Atlassian, Razorpay..."
            className="w-full h-10 px-3.5 rounded-lg bg-[#0A0C13] border border-white/[0.1] text-sm text-foreground placeholder:text-[#64748B] focus:border-primary/70 focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {POPULAR_COMPANIES.slice(0, 8).map((company) => (
              <button
                key={company}
                onClick={() => setDreamCompany(company)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  dreamCompany === company
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "bg-[#0A0C13] text-[#8A96AA] border border-white/[0.06] hover:text-white"
                }`}
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Target Role */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-[#8A96AA] mb-1.5 block">
            Target Role Specification
          </label>
          <input
            value={targetRole || ""}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Software Engineer L4, Distributed Systems Engineer..."
            className="w-full h-10 px-3.5 rounded-lg bg-[#0A0C13] border border-white/[0.1] text-sm text-foreground placeholder:text-[#64748B] focus:border-primary/70 focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>

        {/* Timeline & Hours */}
        <div className="grid sm:grid-cols-2 gap-5 pt-2">
          <div className="p-4 rounded-lg bg-[#0A0C13] border border-white/[0.06]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono text-[#8A96AA]">Timeline Horizon</label>
              <span className="font-mono text-sm font-bold text-blue-400 tabular-nums">{timelineMonths} months</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={timelineMonths || 3}
              onChange={(e) => setTimelineMonths(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
              <span>1 mo</span>
              <span>6 mo</span>
              <span>12 mo</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0A0C13] border border-white/[0.06]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono text-[#8A96AA]">Daily Commitment</label>
              <span className="font-mono text-sm font-bold text-blue-400 tabular-nums">{hoursPerDay}h / day</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={hoursPerDay || 4}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
              <span>1h (light)</span>
              <span>5h (focused)</span>
              <span>10h (intensive)</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-[#8A96AA] mb-2 block">
            Core Curriculum Domains
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {FOCUS_OPTIONS.map((focus) => {
              const isSelected = (focusAreas || []).includes(focus.id);
              return (
                <button
                  key={focus.id}
                  onClick={() => toggleFocus(focus.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-300 font-semibold"
                      : "border-white/[0.06] bg-[#0A0C13] text-[#8A96AA] hover:text-white"
                  }`}
                >
                  <focus.icon className="w-3.5 h-3.5" />
                  <span className="truncate">{focus.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateRoadmap}
          disabled={generating}
          className="w-full h-10 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Synthesizing Multi-Week Strategy...
            </>
          ) : (
            <>
              <Map className="w-4 h-4 mr-2" />
              Generate Bespoke Roadmap
            </>
          )}
        </Button>
      </motion.div>

      {/* Roadmap Display */}
      <AnimatePresence>
        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overview Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Feasibility */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0E111A]">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const cfg = feasibilityConfig[roadmap.overview.feasibility] || feasibilityConfig.ambitious;
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs font-semibold font-mono uppercase ${cfg.color}`}>{cfg.label}</span>
                      </>
                    );
                  })()}
                </div>
                <p className="text-xs text-[#8A96AA] leading-relaxed">
                  {roadmap.overview.feasibilityNote}
                </p>
                {roadmap.overview.alternativeCompanies && roadmap.overview.alternativeCompanies.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono text-[#64748B]">Consider also: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {roadmap.overview.alternativeCompanies.map((c) => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#8A96AA] border border-white/[0.06]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Readiness Score */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0E111A]">
                <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5 font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  Readiness Projection
                </p>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8A96AA]">Current Baseline</span>
                    <span className="font-bold text-rose-400 tabular-nums">{roadmap.overview.currentReadiness}%</span>
                  </div>
                  <Progress value={roadmap.overview.currentReadiness} className="h-1.5" />
                  
                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-[#8A96AA]">Post-Roadmap Projection</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{roadmap.overview.estimatedFinalReadiness}%</span>
                  </div>
                  <Progress value={roadmap.overview.estimatedFinalReadiness} className="h-1.5" />
                  
                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-[#8A96AA]">Target Bar ({dreamCompany})</span>
                    <span className="font-bold text-blue-400 tabular-nums">{roadmap.overview.targetReadiness}%</span>
                  </div>
                  <Progress value={roadmap.overview.targetReadiness} className="h-1.5" />
                </div>
              </div>

              {/* Interview Prep Stats */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0E111A]">
                <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  Interview Targets
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 rounded-lg bg-[#0A0C13] border border-white/[0.05]">
                    <div className="text-lg font-bold text-blue-400 font-mono tabular-nums">{roadmap.interviewPrep.dsaProblemsTarget}</div>
                    <div className="text-[10px] font-mono text-[#8A96AA]">DSA Drill Sets</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#0A0C13] border border-white/[0.05]">
                    <div className="text-lg font-bold text-amber-300 font-mono tabular-nums">{roadmap.interviewPrep.mockInterviewsTarget}</div>
                    <div className="text-[10px] font-mono text-[#8A96AA]">Mock Rounds</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#0A0C13] border border-white/[0.05] col-span-2">
                    <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">{roadmap.interviewPrep.systemDesignTopics?.length || 0}</div>
                    <div className="text-[10px] font-mono text-[#8A96AA]">Architecture Systems</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {roadmap.warnings && roadmap.warnings.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5">
                <h3 className="text-xs font-semibold text-amber-300 flex items-center gap-2 mb-2 font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  Honest Diagnostics & Warnings
                </h3>
                <ul className="space-y-1">
                  {roadmap.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-[#8A96AA] flex gap-2">
                      <span className="text-amber-300">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Gap Analysis */}
            {roadmap.keySkillsToAcquire && roadmap.keySkillsToAcquire.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 font-mono">
                  <Star className="w-4 h-4 text-amber-300" />
                  Key Skill Gaps to Bridge
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roadmap.keySkillsToAcquire.map((skill, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0E111A]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-white">{skill.skill}</span>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priorityColors[skill.priority] || ""}`}>
                          {skill.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#8A96AA]">
                        <span className="capitalize">{skill.currentLevel}</span>
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span className="capitalize text-blue-400 font-medium">{skill.targetLevel}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#64748B] mt-1.5 tabular-nums">
                        ~{skill.estimatedWeeks} weeks to reach hiring bar
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase Timeline */}
            <div>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 font-mono">
                <Map className="w-4 h-4 text-blue-400" />
                Curriculum Progression — {roadmap.phases?.length || 0} Strategic Phases
              </h2>

              <div className="space-y-4">
                {(roadmap.phases || []).map((phase, pi) => {
                  const isExpanded = expandedPhase === pi;
                  return (
                    <div key={pi} className="rounded-xl border border-white/[0.08] bg-[#0E111A] overflow-hidden shadow-sm">
                      <button
                        onClick={() => setExpandedPhase(isExpanded ? null : pi)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                            P{phase.phaseNumber}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-white truncate">{phase.title}</h3>
                            <p className="text-xs text-[#8A96AA] truncate mt-0.5 font-mono">
                              Weeks {phase.startWeek}–{phase.endWeek} • {phase.objective}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="hidden sm:inline font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[#8A96AA] border border-white/[0.06]">
                            Target: {phase.milestone}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#8A96AA]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#8A96AA]" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/[0.06] p-4 bg-[#0A0C13] space-y-4"
                          >
                            {/* Phase Study Resources */}
                            {phase.resources && phase.resources.length > 0 && (
                              <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
                                <h4 className="text-xs font-semibold text-blue-300 font-mono mb-2 flex items-center gap-2">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Curated Learning Resources
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {phase.resources.map((res, ri) => {
                                    const rConfig = resourceTypeConfig[res.type] || resourceTypeConfig.article;
                                    const RIcon = rConfig.icon;
                                    return (
                                      <a
                                        key={ri}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-lg bg-[#0E111A] border border-white/[0.06] hover:border-blue-500/30 flex items-start gap-2.5 transition-all group"
                                      >
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border ${rConfig.color}`}>
                                          <RIcon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                                              {res.title}
                                            </span>
                                            <ExternalLink className="w-3 h-3 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                          </div>
                                          <p className="text-[10px] text-[#8A96AA] mt-0.5 line-clamp-1">
                                            {res.description}
                                          </p>
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Weeks */}
                            <div className="space-y-2.5">
                              {phase.weeks.map((week) => {
                                const weekKey = `${pi}-${week.weekNumber}`;
                                const weekExpanded = expandedWeek === weekKey;

                                return (
                                  <div key={weekKey} className="rounded-lg border border-white/[0.06] bg-[#0E111A] p-3.5">
                                    <button
                                      onClick={() => setExpandedWeek(weekExpanded ? null : weekKey)}
                                      className="w-full flex items-center justify-between text-left cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold text-blue-400">
                                          W{week.weekNumber}
                                        </span>
                                        <div>
                                          <h4 className="text-xs font-semibold text-white">{week.focus}</h4>
                                          <p className="text-[11px] text-[#8A96AA] mt-0.5">
                                            Goal: {week.weeklyGoal}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 font-mono text-[10px] text-[#64748B]">
                                        <span className="hidden sm:inline">
                                          {week.dailyHoursBreakdown.theory}h th • {week.dailyHoursBreakdown.practice}h pr • {week.dailyHoursBreakdown.projects}h pj
                                        </span>
                                        {weekExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-[#8A96AA]" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-[#8A96AA]" />
                                        )}
                                      </div>
                                    </button>

                                    <AnimatePresence>
                                      {weekExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="mt-3 pt-3 border-t border-white/[0.06] space-y-2"
                                        >
                                          {week.tasks.map((task, ti) => {
                                            const TypeIcon = typeIcons[task.type] || CircleDot;
                                            const colorClass = typeColors[task.type] || "text-slate-400 bg-slate-500/10 border-slate-500/20";

                                            return (
                                              <div key={ti} className="p-2.5 rounded-lg bg-[#0A0C13] border border-white/[0.04] flex items-start gap-2.5">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                                                  <TypeIcon className="w-3 h-3" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                    <h5 className="text-xs font-medium text-slate-200">{task.title}</h5>
                                                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${colorClass}`}>
                                                      {task.type.replace("_", " ")}
                                                    </span>
                                                  </div>
                                                  <p className="text-[11px] text-[#8A96AA] mt-0.5 leading-relaxed">
                                                    {task.description}
                                                  </p>
                                                  {task.deliverable && (
                                                    <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                                                      <CheckCircle2 className="w-3 h-3" />
                                                      Deliverable: {task.deliverable}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset / Regenerate */}
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRoadmap(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="h-8.5 px-4 rounded-lg border-white/[0.1] text-xs font-mono tracking-wider uppercase text-slate-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Configure New Target Trajectory
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
