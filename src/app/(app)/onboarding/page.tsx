"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  User,
  FileText,
  Code2,
  FolderKanban,
  Target,
  Link2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

import StepBasicInfo from "./steps/StepBasicInfo";
import StepResume from "./steps/StepResume";
import StepSkills from "./steps/StepSkills";
import StepProjects from "./steps/StepProjects";
import StepGoals from "./steps/StepGoals";
import StepLinks from "./steps/StepLinks";
import type { OnboardingFormData } from "@/types";

const steps = [
  { id: 1, title: "Candidate Identity", icon: User },
  { id: 2, title: "Resume Parsing", icon: FileText },
  { id: 3, title: "Skill Matrix", icon: Code2 },
  { id: 4, title: "Engineering Projects", icon: FolderKanban },
  { id: 5, title: "Placement Targets", icon: Target },
  { id: 6, title: "Handles & Links", icon: Link2 },
];

const initialFormData: OnboardingFormData = {
  full_name: "",
  email: "",
  phone: "",
  education_level: "",
  field_of_study: "",
  experience_level: "fresher",
  skills: [],
  skill_ratings: {},
  projects: [],
  goals: [],
  preferred_role: "",
  preferred_locations: [],
  github_url: "",
  portfolio_url: "",
  linkedin_url: "",
  resume_file: null,
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const updateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const profileData = {
        full_name: formData.full_name,
        phone: formData.phone,
        skills: formData.skills,
        skill_ratings: formData.skill_ratings,
        goals: formData.goals,
        education_level: formData.education_level,
        field_of_study: formData.field_of_study,
        experience_level: formData.experience_level,
        github_url: formData.github_url || null,
        portfolio_url: formData.portfolio_url || null,
        linkedin_url: formData.linkedin_url || null,
        projects: formData.projects,
        preferred_role: formData.preferred_role,
        preferred_locations: formData.preferred_locations,
      };

      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!profileRes.ok) throw new Error("Failed to save profile");

      const completeRes = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      if (!completeRes.ok) throw new Error("Failed to complete onboarding");

      toast.success("Candidate dossier calibrated successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to save dossier");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StepResume formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <StepSkills formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepProjects formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <StepGoals formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <StepLinks formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F4F6F9] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background Grid & Light */}
      <div className="fixed inset-0 subtle-grid pointer-events-none opacity-25" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 p-0.5 bg-[#0E1017]">
              <Image src="/logo.png" alt="CareerAI" fill className="object-cover rounded-md" />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              CareerAI
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>STAGE 0{currentStep} OF 0{steps.length} • {steps[currentStep - 1].title.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Calibrate Candidate Dossier
          </h1>
        </div>

        {/* Step Progression Bar */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-6">
          <div className="p-3 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] flex items-center justify-between gap-1 overflow-x-auto">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-mono flex-shrink-0 ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                      : isCompleted
                      ? "text-emerald-400 hover:bg-white/[0.04]"
                      : "text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs">
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden md:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Card (Double Bezel) */}
        <div className="p-1.5 rounded-3xl bg-white/[0.04] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="p-6 sm:p-8 rounded-[calc(1.5rem-0.375rem)] bg-[#0C0E16] min-h-[420px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="flex-1"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Bottom Step Actions */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/[0.06]">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="h-10 px-5 rounded-xl border-white/10 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center gap-1.5"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="h-10 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Calibrating...
                    </>
                  ) : (
                    <>
                      Complete Setup <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
