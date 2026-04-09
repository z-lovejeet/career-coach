"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code2,
  FolderKanban,
  Target,
  Link2,
  GitBranch,
  ExternalLink,
  Globe,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Star,
  Edit3,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Profile, Analysis, ExtractedSkill, StrengthWeakness, MissingSkill } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, analysisRes] = await Promise.allSettled([
        fetch("/api/profile").then((r) => r.json()),
        fetch("/api/analyze/latest").then((r) => r.json()),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value.success) {
        setProfile(profileRes.value.data);
      }
      if (analysisRes.status === "fulfilled" && analysisRes.value.success) {
        setAnalysis(analysisRes.value.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      toast.info("🧠 AI is analyzing your profile...");
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setAnalysis(data.data);
      toast.success("✅ Profile analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Failed to analyze profile. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Profile not found.</p>
        <Button onClick={() => router.push("/onboarding")} className="mt-4">
          Complete Onboarding
        </Button>
      </div>
    );
  }

  const skillLevelPercent: Record<string, number> = {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  };

  const skillLevelColor: Record<string, string> = {
    beginner: "text-amber-400",
    intermediate: "text-blue-400",
    advanced: "text-violet-400",
    expert: "text-emerald-400",
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profile.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile.full_name || "User"}</h1>
            <p className="text-muted-foreground text-sm">
              {profile.preferred_role || profile.experience_level || "Student"} •{" "}
              {profile.field_of_study || "Computer Science"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/onboarding")}
          className="gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Readiness Score Banner */}
      {analysis && (
        <motion.div
          className="p-6 rounded-2xl glass-strong overflow-hidden relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#profileScoreGrad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - analysis.readiness_score / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="profileScoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{analysis.readiness_score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Readiness Assessment
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary" />
            Personal Info
          </h2>
          <div className="space-y-3 text-sm">
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Phone" value={profile.phone} />
            <InfoRow icon={GraduationCap} label="Education" value={
              profile.education_level
                ? `${profile.education_level} — ${profile.field_of_study || "CS"}`
                : null
            } />
            <InfoRow icon={Briefcase} label="Experience" value={profile.experience_level} />
            <InfoRow icon={Target} label="Target Role" value={profile.preferred_role} />
          </div>
        </motion.div>

        {/* Links */}
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <Link2 className="w-4 h-4 text-primary" />
            Links & Resume
          </h2>
          <div className="space-y-3">
            <LinkRow icon={GitBranch} label="GitHub" url={profile.github_url} />
            <LinkRow icon={ExternalLink} label="LinkedIn" url={profile.linkedin_url} />
            <LinkRow icon={Globe} label="Portfolio" url={profile.portfolio_url} />
            {profile.resume_url && (
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-sm flex-1">Resume</span>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Skills */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <Code2 className="w-4 h-4 text-primary" />
          Skills
          <Badge variant="outline" className="text-[10px] ml-auto">
            {profile.skills.length} skills
          </Badge>
        </h2>

        {profile.skills.length > 0 ? (
          <div className="space-y-4">
            {/* Manual skill ratings */}
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.skills.map((skill) => {
                const rating = profile.skill_ratings?.[skill] || 0;
                return (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="text-sm w-28 truncate">{skill}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(rating / 10) * 100}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{rating}/10</span>
                  </div>
                );
              })}
            </div>

            {/* AI-extracted skills */}
            {analysis && analysis.extracted_skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-identified skills from your profile & resume
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.extracted_skills.map((skill: ExtractedSkill) => (
                    <Badge
                      key={skill.name}
                      variant="outline"
                      className={`text-[11px] ${skillLevelColor[skill.level] || "text-muted-foreground"}`}
                    >
                      {skill.name}
                      <span className="ml-1 opacity-60">{skill.level}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No skills added yet.</p>
        )}
      </motion.div>

      {/* Projects */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <FolderKanban className="w-4 h-4 text-primary" />
          Projects
          <Badge variant="outline" className="text-[10px] ml-auto">
            {profile.projects?.length || 0} projects
          </Badge>
        </h2>
        {profile.projects && profile.projects.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.projects.map((project, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 bg-accent/20">
                <h3 className="font-medium text-sm mb-1">{project.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.tech.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[10px] border-primary/20 text-primary"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No projects added yet.</p>
        )}
      </motion.div>

      {/* Goals */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-primary" />
          Career Goals
        </h2>
        {profile.goals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((goal) => (
              <Badge key={goal} className="bg-primary/10 text-primary border-primary/20 text-xs">
                {goal}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No goals set yet.</p>
        )}
        {profile.preferred_locations?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Preferred Locations</p>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_locations.map((loc) => (
                <Badge key={loc} variant="outline" className="text-[11px]">
                  {loc}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Strengths & Weaknesses */}
      {analysis && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Strengths */}
          <motion.div
            className="p-5 rounded-2xl glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Strengths
            </h2>
            <div className="space-y-3">
              {analysis.strengths.map((s: StrengthWeakness, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5">
                  <p className="font-medium text-sm text-emerald-400">{s.skill}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            className="p-5 rounded-2xl glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Areas to Improve
            </h2>
            <div className="space-y-3">
              {analysis.weaknesses.map((w: StrengthWeakness, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5">
                  <p className="font-medium text-sm text-amber-400">{w.skill}</p>
                  <p className="text-xs text-muted-foreground mt-1">{w.reason}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Missing Skills */}
      {analysis && analysis.missing_skills.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-rose-400" />
            Missing Skills
            <Badge variant="outline" className="text-[10px] ml-auto text-rose-400 border-rose-500/20">
              {analysis.missing_skills.length} gaps
            </Badge>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.missing_skills.map((skill: MissingSkill, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border/50 bg-accent/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{skill.skill}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      skill.importance === "critical"
                        ? "text-rose-400 border-rose-500/20"
                        : skill.importance === "high"
                        ? "text-amber-400 border-amber-500/20"
                        : "text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {skill.importance}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{skill.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Analysis CTA */}
      {!analysis && (
        <motion.div
          className="p-6 rounded-2xl glass-strong text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-float">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Get Your AI Profile Analysis</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Let our AI analyze your skills, projects, and resume to assess your
            placement readiness and identify areas for improvement.
          </p>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="gradient-primary text-white border-0 gap-2 hover:opacity-90 glow"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run AI Analysis
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* Helper Components */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <span className="truncate">{value || "—"}</span>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  url,
}: {
  icon: typeof GitBranch;
  label: string;
  url: string | null | undefined;
}) {
  if (!url) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg opacity-40">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground ml-auto">Not added</span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm flex-1 truncate">{url}</span>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </a>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
