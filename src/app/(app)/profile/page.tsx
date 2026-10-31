"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  User,
  Mail,
  GraduationCap,
  Briefcase,
  Globe,
  Code2,
  FileText,
  Edit3,
  Flame,
  Upload,
  Loader2,
  Sparkles,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      toast.error('Only PDF documents are supported for dossier ingestion');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/onboarding/resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        toast.success('Resume ingested & parsed via Gemini 3.8 Flash!');
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
      toast.info('Running deep multi-modal analysis via Gemini 3.8...');
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        revalidateAnalysis();
        toast.success('Candidate dossier analysis calibrated!');
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
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-[#8A96AA] font-mono">
        <User className="w-12 h-12 mx-auto mb-4 opacity-40 text-blue-400" />
        <p className="text-white text-base font-semibold">Candidate Dossier Not Found</p>
        <p className="text-xs text-[#8A96AA] mt-1">Please complete onboarding to initialize your profile.</p>
        <Button
          className="mt-5 h-9 px-5 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs uppercase cursor-pointer"
          onClick={() => router.push("/onboarding")}
        >
          Begin Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
              Candidate Dossier
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">ID: verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Engineering Profile & Skills
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/onboarding")}
          className="h-8.5 px-3.5 rounded-lg border-white/[0.1] hover:border-white/[0.2] text-xs font-mono uppercase tracking-wider text-slate-300 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile Specs
        </Button>
      </div>

      {/* ─── Hero Dossier Card ─── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white text-2xl font-bold font-mono flex-shrink-0 shadow-sm">
              {profile.full_name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{profile.full_name}</h2>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs sm:text-sm font-mono text-blue-400 mt-0.5">
                {profile.preferred_role || "Full-Stack Software Engineer"}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs font-mono text-[#8A96AA]">
                {profile.email && (
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#64748B]" />{profile.email}</span>
                )}
                {profile.education_level && (
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#64748B]" />{profile.education_level} • {profile.field_of_study}</span>
                )}
                {profile.experience_level && (
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#64748B]" />{profile.experience_level}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 font-mono self-stretch sm:self-auto justify-end">
            {analysis && (
              <div className="px-3.5 py-2 rounded-lg bg-[#0A0C13] border border-white/[0.08] text-center min-w-[75px]">
                <p className="text-lg font-bold text-blue-400 tabular-nums">{analysis.readiness_score}</p>
                <p className="text-[10px] text-[#8A96AA] uppercase">Readiness</p>
              </div>
            )}
            {streak && (
              <div className="px-3.5 py-2 rounded-lg bg-[#0A0C13] border border-white/[0.08] text-center min-w-[75px]">
                <p className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1 tabular-nums">
                  <Flame className="w-3.5 h-3.5 fill-orange-500/30" />{streak.streak.current}
                </p>
                <p className="text-[10px] text-[#8A96AA] uppercase">Streak</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Links & Resume Row ─── */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Verified Links */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Verified Candidate Handles
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {profile.github_url ? (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-[#0A0C13] border border-white/[0.06] hover:border-blue-500/30 flex items-center justify-between text-slate-300 hover:text-white transition-all">
                  <span>GitHub Profile</span>
                  <span className="text-blue-400 text-[10px] flex items-center gap-1">CONNECTED <ExternalLink className="w-3 h-3" /></span>
                </a>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#0A0C13] border border-white/[0.04] text-[#64748B] text-[11px]">
                  No GitHub URL linked
                </div>
              )}

              {profile.linkedin_url ? (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-[#0A0C13] border border-white/[0.06] hover:border-blue-500/30 flex items-center justify-between text-slate-300 hover:text-white transition-all">
                  <span>LinkedIn Profile</span>
                  <span className="text-blue-400 text-[10px] flex items-center gap-1">CONNECTED <ExternalLink className="w-3 h-3" /></span>
                </a>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#0A0C13] border border-white/[0.04] text-[#64748B] text-[11px]">
                  No LinkedIn URL linked
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resume Management */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Resume Multi-Modal Ingestion
            </h3>
            <div className="p-3 rounded-lg bg-[#0A0C13] border border-white/[0.06] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {profile.resume_url ? "Candidate Resume PDF Attached" : "No Resume Uploaded"}
                </p>
                <p className="text-[10px] font-mono text-[#8A96AA]">
                  Parsed via Gemini 3.8 Flash multi-modal parser
                </p>
              </div>

              <label className="cursor-pointer flex-shrink-0">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                  disabled={uploading}
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/25 text-xs font-mono transition-all">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Ingesting..." : "Upload PDF"}
                </span>
              </label>
            </div>
          </div>

          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="w-full mt-3 h-9 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider shadow-sm cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Calibrating Dossier...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Trigger Full AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Skills Inventory ─── */}
      {profile.skills?.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 shadow-sm">
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-400" />
            Self-Rated Proficiencies ({profile.skills.length})
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {profile.skills.map((skill) => {
              const rating = profile.skill_ratings?.[skill] || 5;
              return (
                <div key={skill} className="p-3 rounded-lg bg-[#0A0C13] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{skill}</span>
                  <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${
                    rating >= 7 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {rating} / 10
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CV Analysis Report (Full Breakdown) ─── */}
      {analysis && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                AI SYNTHESIZED REPORT
              </span>
              <h3 className="text-base font-bold text-white mt-1">Candidate Placement Readiness</h3>
            </div>
            <span className="font-mono text-2xl font-bold text-blue-400 tabular-nums">
              {analysis.readiness_score} <span className="text-xs text-[#8A96AA] font-normal">/ 100</span>
            </span>
          </div>

          {/* Assessment Narrative */}
          <div className="p-4 rounded-lg bg-[#0A0C13] border border-white/[0.06] text-xs sm:text-sm text-[#D0D6E2] leading-relaxed font-sans">
            <span className="font-mono text-[10px] text-blue-400 uppercase tracking-wider block mb-1.5 font-semibold">
              Executive Synthesis
            </span>
            {analysis.summary}
          </div>

          {/* Strengths & Missing Skills Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-lg bg-[#0A0C13] border border-emerald-500/20">
              <span className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-3">
                <Check className="w-3.5 h-3.5" /> Verified Candidate Strengths
              </span>
              <div className="space-y-2">
                {analysis.strengths?.map((s, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-semibold text-slate-200">{s.skill}</p>
                    {s.reason && <p className="text-[11px] text-[#8A96AA] mt-0.5">{s.reason}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="p-4 rounded-lg bg-[#0A0C13] border border-rose-500/20">
              <span className="font-mono text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5" /> High-Priority Missing Skills
              </span>
              <div className="space-y-2">
                {analysis.missing_skills?.map((m, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-200">{m.skill}</p>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {m.importance}
                      </span>
                    </div>
                    {m.reason && <p className="text-[11px] text-[#8A96AA] mt-0.5">{m.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
