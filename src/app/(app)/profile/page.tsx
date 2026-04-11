"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Globe,
  Code2,
  Target,
  FolderKanban,
  FileText,
  Edit3,
  CheckCircle2,
  Flame,
  Star,
  TrendingUp,
  BarChart3,
  Upload,
  Loader2,
  Sparkles,
  ArrowRight,
  Brain,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  education_level: string;
  field_of_study: string;
  experience_level: string;
  skills: string[];
  skill_ratings: Record<string, number>;
  goals: string[];
  projects: Array<{ name: string; description: string; tech_stack: string[] }>;
  preferred_role: string;
  preferred_locations: string[];
  github_url: string;
  portfolio_url: string;
  linkedin_url: string;
  resume_url: string;
  onboarding_complete: boolean;
  created_at: string;
}

interface FullAnalysis {
  readiness_score: number;
  extracted_skills: Array<{ name: string; level: string; confidence: number }>;
  strengths: Array<{ skill: string; reason: string }>;
  weaknesses: Array<{ skill: string; reason: string }>;
  missing_skills: Array<{ skill: string; importance: string; reason: string }>;
  summary: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfilePage() {
  const { data: profileRes, isLoading: loadingProfile, mutate: revalidateProfile } = useSWR('/api/profile', fetcher);
  const { data: streakRes, isLoading: loadingStreak } = useSWR('/api/streak', fetcher);
  const { data: analysisRes, isLoading: loadingAnalysis, mutate: revalidateAnalysis } = useSWR('/api/analyze/latest', fetcher);

  const profile: ProfileData | null = profileRes?.success ? profileRes.data : null;
  const streak = streakRes?.success ? streakRes.data : null;
  const analysis: FullAnalysis | null = analysisRes?.success ? analysisRes.data : null;

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const loading = loadingProfile || loadingStreak || loadingAnalysis;

  const handleResumeUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/onboarding/resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success('Resume uploaded successfully!');
        revalidateProfile();
        revalidateAnalysis();
      } else {
        toast.error(data.error?.message || 'Upload failed');
      }
    } catch {
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      toast.info('Running AI analysis... This takes 15-30 seconds.');
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        revalidateAnalysis();
        toast.success('Analysis complete!');
      } else {
        toast.error(data.error?.message || 'Analysis failed');
      }
    } catch {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Profile not found. Complete onboarding first.</p>
        <Button className="mt-4" onClick={() => router.push("/onboarding")}>
          Go to Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/onboarding")} className="gap-2">
          <Edit3 className="w-4 h-4" /> Edit Profile
        </Button>
      </div>

      {/* Hero Card */}
      <motion.div
        className="p-6 rounded-2xl glass-strong"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.full_name}</h2>
            <p className="text-muted-foreground text-sm">{profile.preferred_role || "Aspiring Developer"}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {profile.email && (
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{profile.phone}</span>
              )}
              {profile.education_level && (
                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{profile.education_level} — {profile.field_of_study}</span>
              )}
              {profile.experience_level && (
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{profile.experience_level}</span>
              )}
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {analysis && (
              <div className="px-3 py-2 rounded-xl glass text-center min-w-[70px]">
                <p className="text-lg font-bold text-primary">{analysis.readiness_score}</p>
                <p className="text-[10px] text-muted-foreground">Score</p>
              </div>
            )}
            {streak && (
              <>
                <div className="px-3 py-2 rounded-xl glass text-center min-w-[70px]">
                  <p className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4" />{streak.streak.current}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Streak</p>
                </div>
                <div className="px-3 py-2 rounded-xl glass text-center min-w-[70px]">
                  <p className="text-lg font-bold text-violet-400 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4" />Lv{streak.xp.level}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{streak.xp.total} XP</p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Links */}
      {(profile.github_url || profile.linkedin_url || profile.portfolio_url || profile.resume_url) && (
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Links
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg glass hover:glass-strong transition-all text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg glass hover:glass-strong transition-all text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg glass hover:glass-strong transition-all text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Portfolio
              </a>
            )}
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg glass hover:glass-strong transition-all text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Resume
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" /> Skills ({profile.skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(skill => {
              const rating = profile.skill_ratings?.[skill];
              return (
                <Badge key={skill} variant="outline" className="text-xs gap-1.5 py-1">
                  {skill}
                  {rating && (
                    <span className={`text-[10px] font-bold ${
                      rating >= 7 ? "text-emerald-400" : rating >= 4 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {rating}/10
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Goals */}
      {profile.goals?.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" /> Goals
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.goals.map(goal => (
              <Badge key={goal} className="bg-primary/10 text-primary border-primary/20 text-xs">
                {goal}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Projects */}
      {profile.projects?.length > 0 && (
        <motion.div
          className="p-5 rounded-2xl glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-rose-400" /> Projects ({profile.projects.length})
          </h3>
          <div className="space-y-3">
            {profile.projects.map((project, i) => (
              <div key={i} className="p-3 rounded-xl bg-accent/30 border border-border/50">
                <h4 className="font-medium text-sm">{project.name}</h4>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                )}
                {project.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.tech_stack.map(tech => (
                      <Badge key={tech} variant="outline" className="text-[10px]">{tech}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resume Upload Card */}
      <motion.div
        className="p-5 rounded-2xl glass"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Resume
        </h3>

        <div className="flex items-center gap-4 p-3 rounded-xl bg-accent/30 border border-border/50">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {profile.resume_url ? (
              <>
                <p className="text-sm font-medium">Resume uploaded</p>
                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">View resume</a>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No resume uploaded</p>
                <p className="text-xs text-muted-foreground">Upload your resume for AI analysis</p>
              </>
            )}
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
              disabled={uploading}
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading...' : profile.resume_url ? 'Re-upload' : 'Upload'}
            </span>
          </label>
        </div>

        {/* Run analysis button */}
        <Button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full gradient-primary text-white border-0 gap-2 hover:opacity-90 mt-4"
        >
          {analyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your profile...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {analysis ? 'Re-run AI Analysis' : 'Run AI Analysis'}</>
          )}
        </Button>
      </motion.div>

      {/* ═══════════════════════════════════════ */}
      {/* CV Analysis Report */}
      {/* ═══════════════════════════════════════ */}
      {analysis && (
        <motion.div
          className="p-5 rounded-2xl glass-strong border border-primary/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              CV Analysis Report
            </h3>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              AI-Generated
            </Badge>
          </div>

          {/* Readiness Score */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50 mb-4">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${
                analysis.readiness_score >= 70 ? 'text-emerald-400' : analysis.readiness_score >= 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {analysis.readiness_score}<span className="text-sm text-muted-foreground font-normal">/100</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Placement Readiness Score</p>
                <p className="text-xs text-muted-foreground">
                  {analysis.readiness_score >= 70 ? '🎯 Well prepared for placements!' : analysis.readiness_score >= 40 ? '📈 Good progress — keep pushing!' : '🔥 Needs focused preparation'}
                </p>
                <Progress value={analysis.readiness_score} className="h-2 mt-2" />
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {analysis.summary && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-4">
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Assessment
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Strengths ({analysis.strengths.length})
                </p>
                <div className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 text-xs">✓</span>
                      <div>
                        <p className="text-xs font-medium text-emerald-300">{s.skill}</p>
                        {s.reason && <p className="text-[11px] text-muted-foreground">{s.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {analysis.weaknesses?.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> Areas to Improve ({analysis.weaknesses.length})
                </p>
                <div className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 text-xs">⚠</span>
                      <div>
                        <p className="text-xs font-medium text-amber-300">{w.skill}</p>
                        {w.reason && <p className="text-[11px] text-muted-foreground">{w.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Missing Skills */}
          {analysis.missing_skills?.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mt-4">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> Missing Skills for Target Role ({analysis.missing_skills.length})
              </p>
              <div className="space-y-2">
                {analysis.missing_skills.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-accent/30">
                    <span className="text-rose-400 mt-0.5 text-xs">✕</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{m.skill}</p>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                          m.importance === 'critical' ? 'text-rose-400 border-rose-500/30' : m.importance === 'high' ? 'text-amber-400 border-amber-500/30' : 'text-muted-foreground'
                        }`}>{m.importance}</Badge>
                      </div>
                      {m.reason && <p className="text-[11px] text-muted-foreground mt-0.5">{m.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Skills */}
          {analysis.extracted_skills?.length > 0 && (
            <div className="p-4 rounded-xl glass mt-4">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Extracted Skills ({analysis.extracted_skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.extracted_skills.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1.5 py-1">
                    {s.name}
                    <span className={`text-[10px] font-bold ${
                      s.confidence >= 80 ? 'text-emerald-400' : s.confidence >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {s.level}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => router.push('/dashboard')}
            >
              View Full Dashboard <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={runAnalysis}
              disabled={analyzing}
            >
              <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
          </div>
        </motion.div>
      )}

      {/* No analysis yet prompt */}
      {!analysis && !loadingAnalysis && (
        <motion.div
          className="p-6 rounded-2xl glass text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium mb-1">No CV Analysis Report Yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Upload your resume and run AI analysis to get a detailed placement readiness report.
          </p>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="gradient-primary text-white border-0 gap-2 hover:opacity-90"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Analysis Report</>
            )}
          </Button>
        </motion.div>
      )}

      {/* Member since */}
      <p className="text-xs text-muted-foreground text-center">
        Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
