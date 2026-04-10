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
  project: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  soft_skills: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  revision: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  mock_interview: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const priorityColors: Record<string, string> = {
  critical: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  high: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  medium: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  low: "text-slate-400 border-slate-500/30 bg-slate-500/10",
};

const feasibilityConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  realistic: { color: "text-emerald-400", icon: CheckCircle2, label: "Achievable" },
  ambitious: { color: "text-amber-400", icon: Zap, label: "Ambitious" },
  unrealistic: { color: "text-rose-400", icon: AlertTriangle, label: "Very Challenging" },
};

const resourceTypeConfig: Record<string, { icon: typeof Video; color: string; label: string }> = {
  youtube_playlist: { icon: Video, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "YT Playlist" },
  youtube: { icon: Video, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "YouTube" },
  documentation: { icon: FileText, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", label: "Docs" },
  course: { icon: GraduationCap, color: "text-purple-400 bg-purple-500/10 border-purple-500/20", label: "Course" },
  practice: { icon: Dumbbell, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Practice" },
  article: { icon: Newspaper, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Article" },
  tool: { icon: Wrench, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", label: "Tool" },
};

export default function RoadmapPage() {
  // Input form state (persisted)
  const [dreamCompany, setDreamCompany] = useLocalStorage("roadmap_dreamCompany", "");
  const [targetRole, setTargetRole] = useLocalStorage("roadmap_targetRole", "Software Engineer");
  const [timelineMonths, setTimelineMonths] = useLocalStorage("roadmap_timelineMonths", 3);
  const [hoursPerDay, setHoursPerDay] = useLocalStorage("roadmap_hoursPerDay", 4);
  const [focusAreas, setFocusAreas] = useLocalStorage<string[]>("roadmap_focusAreas", ["dsa", "web_dev"]);
  
  const [generating, setGenerating] = useState(false);

  // Roadmap state (persisted)
  const [roadmap, setRoadmap] = useLocalStorage<Roadmap | null>("career_ai_roadmap", null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Hydration guard — prevents SSR from overwriting localStorage values
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
      toast.info("🗺️ Generating your personalized roadmap... This takes 15-30 seconds.");
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
      
      // Normalize: ensure all expected fields have defaults
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
      
      // Only save if phases were actually generated
      if (normalized.phases.length === 0) {
        toast.error("Roadmap generated without phases. Please try again.");
        return;
      }

      setRoadmap(normalized);
      setExpandedPhase(0);
      toast.success("✅ Roadmap generated! Scroll down to explore.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to generate roadmap. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Prevent hydration mismatch — useLocalStorage values differ between server and client
  if (!mounted) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Map className="w-8 h-8 text-primary" />
            Roadmap Maker
          </h1>
          <p className="text-muted-foreground">
            AI-powered career preparation roadmap — brutally honest, week-by-week
          </p>
        </div>
        <div className="p-6 rounded-2xl glass-strong flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Map className="w-8 h-8 text-primary" />
          Roadmap Maker
        </h1>
        <p className="text-muted-foreground">
          AI-powered career preparation roadmap — brutally honest, week-by-week
        </p>
      </div>

      {/* Input Form */}
      <motion.div
        className="p-6 rounded-2xl glass-strong space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Configure Your Roadmap
        </h2>

        {/* Dream Company */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Dream Company
          </label>
          <input
            value={dreamCompany || ""}
            onChange={(e) => setDreamCompany(e.target.value)}
            placeholder="e.g., Google, Flipkart, Goldman Sachs..."
            className="w-full px-4 py-3 rounded-xl bg-accent/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POPULAR_COMPANIES.map((company) => (
              <button
                key={company}
                onClick={() => setDreamCompany(company)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  dreamCompany === company
                    ? "gradient-primary text-white"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Target Role */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Target Role
          </label>
          <input
            value={targetRole || ""}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Software Engineer, Frontend Developer..."
            className="w-full px-4 py-3 rounded-xl bg-accent/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
        </div>

        {/* Timeline & Hours */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Timeline: <span className="text-primary font-bold">{timelineMonths} months</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={timelineMonths || 3}
              onChange={(e) => setTimelineMonths(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1 month</span>
              <span>6 months</span>
              <span>12 months</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Hours/Day: <span className="text-primary font-bold">{hoursPerDay}h</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={hoursPerDay || 4}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1h (casual)</span>
              <span>5h (focused)</span>
              <span>10h (intense)</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Focus Areas
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FOCUS_OPTIONS.map((focus) => {
              const isSelected = (focusAreas || []).includes(focus.id);
              return (
                <button
                  key={focus.id}
                  onClick={() => toggleFocus(focus.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm ${
                    isSelected
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-accent/30 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <focus.icon className="w-4 h-4" />
                  {focus.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateRoadmap}
          disabled={generating}
          size="lg"
          className="w-full gradient-primary text-white border-0 gap-2 text-base hover:opacity-90 glow"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Roadmap...
            </>
          ) : (
            <>
              <Map className="w-5 h-5" />
              Generate My Roadmap
            </>
          )}
        </Button>
      </motion.div>

      {/* Roadmap Display */}
      <AnimatePresence>
        {mounted && roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overview Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Feasibility */}
              <div className="p-5 rounded-xl glass-strong">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const cfg = feasibilityConfig[roadmap.overview.feasibility] || feasibilityConfig.ambitious;
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                        <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {roadmap.overview.feasibilityNote}
                </p>
                {roadmap.overview.alternativeCompanies && roadmap.overview.alternativeCompanies.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] text-muted-foreground">Consider also: </span>
                    {roadmap.overview.alternativeCompanies.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] mr-1 mt-1">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Readiness Score */}
              <div className="p-5 rounded-xl glass-strong">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Readiness Projection
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current</span>
                    <span className="font-bold text-rose-400">{roadmap.overview.currentReadiness}%</span>
                  </div>
                  <Progress value={roadmap.overview.currentReadiness} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">After Roadmap</span>
                    <span className="font-bold text-emerald-400">{roadmap.overview.estimatedFinalReadiness}%</span>
                  </div>
                  <Progress value={roadmap.overview.estimatedFinalReadiness} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Target ({dreamCompany})</span>
                    <span className="font-bold text-primary">{roadmap.overview.targetReadiness}%</span>
                  </div>
                  <Progress value={roadmap.overview.targetReadiness} className="h-2" />
                </div>
              </div>

              {/* Interview Prep Stats */}
              <div className="p-5 rounded-xl glass-strong">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Interview Prep Targets
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-accent/50">
                    <div className="text-xl font-bold text-primary">{roadmap.interviewPrep.dsaProblemsTarget}</div>
                    <div className="text-[10px] text-muted-foreground">DSA Problems</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-accent/50">
                    <div className="text-xl font-bold text-amber-400">{roadmap.interviewPrep.mockInterviewsTarget}</div>
                    <div className="text-[10px] text-muted-foreground">Mock Interviews</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-accent/50 col-span-2">
                    <div className="text-xl font-bold text-emerald-400">{roadmap.interviewPrep.systemDesignTopics?.length || 0}</div>
                    <div className="text-[10px] text-muted-foreground">System Design Topics</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {roadmap.warnings && roadmap.warnings.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Honest Warnings
                </h3>
                <ul className="space-y-1">
                  {roadmap.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Gap Analysis */}
            {roadmap.keySkillsToAcquire && roadmap.keySkillsToAcquire.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Skill Gap Analysis
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roadmap.keySkillsToAcquire.map((skill, i) => (
                    <motion.div
                      key={i}
                      className="p-4 rounded-xl glass"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{skill.skill}</span>
                        <Badge variant="outline" className={`text-[10px] ${priorityColors[skill.priority] || ""}`}>
                          {skill.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{skill.currentLevel}</span>
                        <ArrowRight className="w-3 h-3 text-primary" />
                        <span className="capitalize text-primary font-medium">{skill.targetLevel}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        ~{skill.estimatedWeeks} weeks to reach target
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Tips */}
            {roadmap.interviewPrep.companySpecificTips && roadmap.interviewPrep.companySpecificTips.length > 0 && (
              <div className="p-4 rounded-xl glass">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  {dreamCompany} Interview Tips
                </h3>
                <ul className="space-y-2">
                  {roadmap.interviewPrep.companySpecificTips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <Shield className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Phase Timeline */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" />
                Week-by-Week Roadmap — {roadmap.phases?.length || 0} Phases
              </h2>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/10 hidden sm:block" />

                <div className="space-y-4">
                  {(roadmap.phases || []).map((phase, pi) => {
                    const isExpanded = expandedPhase === pi;
                    return (
                      <motion.div
                        key={pi}
                        className="relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pi * 0.08 }}
                      >
                        {/* Phase Header */}
                        <button
                          onClick={() => setExpandedPhase(isExpanded ? null : pi)}
                          className="w-full flex items-center gap-4 text-left group"
                        >
                          {/* Timeline dot */}
                          <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold z-10 relative flex-shrink-0 hidden sm:flex">
                            P{phase.phaseNumber}
                          </div>
                          <div className="flex-1 p-4 rounded-xl glass-strong group-hover:border-primary/30 border border-transparent transition-all">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="sm:hidden text-xs font-bold text-primary">P{phase.phaseNumber}</span>
                                  <h3 className="font-semibold text-sm">{phase.title}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Weeks {phase.startWeek}–{phase.endWeek} · {phase.objective}
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          {/* Milestone badge */}
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary">
                              <Target className="w-3 h-3" />
                              Milestone: {phase.milestone}
                            </div>
                            {/* Resource count preview */}
                            {phase.resources && phase.resources.length > 0 && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <BookOpen className="w-3 h-3" />
                                {phase.resources.length} study resources included
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Expanded Weeks */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden sm:ml-[22px] sm:pl-8 sm:border-l border-primary/10"
                            >
                              <div className="pt-3 space-y-3">
                                {/* 📚 Phase Study Resources */}
                                {phase.resources && phase.resources.length > 0 && (
                                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                      <BookOpen className="w-4 h-4 text-primary" />
                                      Study Resources for this Phase
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
                                            className="group flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                                          >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${rConfig.color}`}>
                                              <RIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-medium group-hover:text-primary transition-colors line-clamp-1">
                                                  {res.title}
                                                </span>
                                                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                              </div>
                                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                                {res.description}
                                              </p>
                                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 mt-1 ${rConfig.color}`}>
                                                {rConfig.label}
                                              </Badge>
                                            </div>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {phase.weeks.map((week) => {
                                  const weekKey = `${pi}-${week.weekNumber}`;
                                  const weekExpanded = expandedWeek === weekKey;

                                  return (
                                    <div key={weekKey} className="rounded-xl glass p-4">
                                      <button
                                        onClick={() => setExpandedWeek(weekExpanded ? null : weekKey)}
                                        className="w-full text-left"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                              W{week.weekNumber}
                                            </div>
                                            <div>
                                              <h4 className="text-sm font-medium">{week.focus}</h4>
                                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Goal: {week.weeklyGoal}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                                              <Clock className="w-3 h-3" />
                                              {week.dailyHoursBreakdown.theory}h theory ·{" "}
                                              {week.dailyHoursBreakdown.practice}h practice ·{" "}
                                              {week.dailyHoursBreakdown.projects}h projects
                                            </div>
                                            {weekExpanded ? (
                                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            )}
                                          </div>
                                        </div>
                                      </button>

                                      {/* Tasks */}
                                      <AnimatePresence>
                                        {weekExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="mt-3 space-y-2 pt-3 border-t border-border/50">
                                              {week.tasks.map((task, ti) => {
                                                const TypeIcon = typeIcons[task.type] || CircleDot;
                                                const colorClass = typeColors[task.type] || "text-slate-400 bg-slate-500/10 border-slate-500/20";

                                                return (
                                                  <div
                                                    key={ti}
                                                    className="p-3 rounded-lg bg-accent/30 border border-border/50"
                                                  >
                                                    <div className="flex items-start gap-3">
                                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                                                        <TypeIcon className="w-3.5 h-3.5" />
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                          <h5 className="text-xs font-medium">{task.title}</h5>
                                                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${colorClass}`}>
                                                            {task.type.replace("_", " ")}
                                                          </Badge>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-1">
                                                          {task.description}
                                                        </p>
                                                        {task.deliverable && (
                                                          <div className="text-[11px] text-primary mt-1 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Deliverable: {task.deliverable}
                                                          </div>
                                                        )}
                                                        {task.resources && task.resources.length > 0 && (
                                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {task.resources.map((r, ri) => (
                                                              <span
                                                                key={ri}
                                                                className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground"
                                                              >
                                                                📚 {r}
                                                              </span>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Regenerate */}
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRoadmap(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Create New Roadmap
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
