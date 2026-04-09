"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
  Brain,
  Code2,
  FolderKanban,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { OnboardingFormData } from "@/types";

interface Props {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

interface ResumeAnalysis {
  skills: string[];
  skill_ratings: Record<string, number>;
  projects: Array<{ name: string; tech: string[]; description: string; url: string }>;
  education_level: string;
  field_of_study: string;
  experience_level: string;
  preferred_role: string;
  full_name: string;
  summary: string;
}

export default function StepResume({ formData, updateFormData }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [applied, setApplied] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted!");
      return;
    }
    updateFormData({ resume_file: file });

    // Immediately upload and analyze
    setAnalyzing(true);
    setAnalysis(null);
    setApplied(false);

    try {
      toast.info("🧠 Analyzing your resume with AI... This takes 10-20 seconds.");

      const formDataUpload = new FormData();
      formDataUpload.append("resume", file);

      const res = await fetch("/api/onboarding/resume", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Analysis failed");
      }

      setAnalysis(data.data.analysis);
      toast.success("✅ Resume analyzed! Review extracted data below.");
    } catch (err) {
      console.error(err);
      toast.error("Resume analysis failed. You can still fill in details manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAnalysis = () => {
    if (!analysis) return;

    // Merge extracted data into form (preserve existing entries)
    const mergedSkills = Array.from(new Set([...formData.skills, ...analysis.skills]));
    const mergedRatings = { ...formData.skill_ratings, ...analysis.skill_ratings };
    const mergedProjects = [
      ...formData.projects,
      ...analysis.projects.filter(
        (ap) => !formData.projects.some((fp) => fp.name.toLowerCase() === ap.name.toLowerCase())
      ),
    ];

    updateFormData({
      skills: mergedSkills,
      skill_ratings: mergedRatings,
      projects: mergedProjects,
      full_name: formData.full_name || analysis.full_name || "",
      education_level: formData.education_level || analysis.education_level || "",
      field_of_study: formData.field_of_study || analysis.field_of_study || "",
      experience_level: formData.experience_level || analysis.experience_level || "fresher",
      preferred_role: formData.preferred_role || analysis.preferred_role || "",
    });

    setApplied(true);
    toast.success(`🎉 Applied: ${analysis.skills.length} skills + ${analysis.projects.length} projects auto-filled!`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    updateFormData({ resume_file: null });
    setAnalysis(null);
    setApplied(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Upload Your Resume</h2>
        <p className="text-sm text-muted-foreground">
          Upload a PDF and our <strong>AI will extract skills, projects, education & more</strong> automatically.
        </p>
      </div>

      {/* Upload area */}
      {formData.resume_file ? (
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{formData.resume_file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(formData.resume_file.size / 1024).toFixed(1)} KB
                {analyzing ? " — Analyzing..." : analysis ? " — Analysis complete ✅" : ""}
              </p>
            </div>
            {!analyzing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`relative p-10 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <p className="font-medium mb-1">Drop your resume here or click to browse</p>
            <p className="text-sm text-muted-foreground">PDF files only, up to 10MB</p>
          </div>
        </div>
      )}

      {/* Analyzing Spinner */}
      {analyzing && (
        <div className="p-6 rounded-xl glass text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="font-medium text-sm">AI is reading your resume...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Extracting skills, projects, education, and experience
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !analyzing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              AI Extracted Data
            </h3>
            {!applied ? (
              <Button
                size="sm"
                onClick={applyAnalysis}
                className="gradient-primary text-white border-0 gap-1.5 text-xs hover:opacity-90"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply All to Profile
              </Button>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Applied ✓
              </Badge>
            )}
          </div>

          {/* Summary */}
          {analysis.summary && (
            <p className="text-xs text-muted-foreground italic p-3 rounded-lg bg-accent/50 border border-border">
              &ldquo;{analysis.summary}&rdquo;
            </p>
          )}

          {/* Skills extracted */}
          <div className="p-4 rounded-xl glass">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold">{analysis.skills.length} Skills Found</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="text-[11px]"
                >
                  {skill}
                  <span className="ml-1 text-primary font-bold">
                    {analysis.skill_ratings[skill] || "?"}
                  </span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Projects extracted */}
          {analysis.projects.length > 0 && (
            <div className="p-4 rounded-xl glass">
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold">{analysis.projects.length} Projects Found</span>
              </div>
              <div className="space-y-2">
                {analysis.projects.map((p, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-accent/60 border border-border/50">
                    <p className="text-xs font-medium">{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    )}
                    {p.tech.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.tech.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education / Role */}
          <div className="grid grid-cols-2 gap-3">
            {analysis.education_level && (
              <div className="p-3 rounded-xl glass">
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold">Education</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.education_level} — {analysis.field_of_study || "CS"}
                </p>
              </div>
            )}
            {analysis.preferred_role && (
              <div className="p-3 rounded-xl glass">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-semibold">Target Role</span>
                </div>
                <p className="text-xs text-muted-foreground">{analysis.preferred_role}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="p-4 rounded-xl bg-accent/50 border border-border">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              What our AI extracts from your resume:
            </p>
            <ul className="text-muted-foreground space-y-0.5 text-xs">
              <li>• Technical and soft skills with proficiency ratings</li>
              <li>• Projects with tech stack and descriptions</li>
              <li>• Education level and field of study</li>
              <li>• Experience level and target role</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
