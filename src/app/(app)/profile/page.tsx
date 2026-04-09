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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [streak, setStreak] = useState<{ streak: { current: number; longest: number }; xp: { total: number; level: number; xpProgress: number } } | null>(null);
  const [analysis, setAnalysis] = useState<{ readiness_score: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profileRes, streakRes, analysisRes] = await Promise.allSettled([
        fetch("/api/profile").then(r => r.json()),
        fetch("/api/streak").then(r => r.json()),
        fetch("/api/analyze/latest").then(r => r.json()),
      ]);
      if (profileRes.status === "fulfilled" && profileRes.value.success) setProfile(profileRes.value.data);
      if (streakRes.status === "fulfilled" && streakRes.value.success) setStreak(streakRes.value.data);
      if (analysisRes.status === "fulfilled" && analysisRes.value.success) setAnalysis(analysisRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

      {/* Member since */}
      <p className="text-xs text-muted-foreground text-center">
        Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
