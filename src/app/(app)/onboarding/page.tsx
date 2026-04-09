"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
import { Progress } from "@/components/ui/progress";

import StepBasicInfo from "./steps/StepBasicInfo";
import StepResume from "./steps/StepResume";
import StepSkills from "./steps/StepSkills";
import StepProjects from "./steps/StepProjects";
import StepGoals from "./steps/StepGoals";
import StepLinks from "./steps/StepLinks";
import type { OnboardingFormData, Project } from "@/types";

const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Resume", icon: FileText },
  { id: 3, title: "Skills", icon: Code2 },
  { id: 4, title: "Projects", icon: FolderKanban },
  { id: 5, title: "Goals", icon: Target },
  { id: 6, title: "Links", icon: Link2 },
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
  const [resumeText, setResumeText] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const progress = (currentStep / steps.length) * 100;

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
      // Resume is already uploaded and analyzed in Step 2 (StepResume)
      // Just save the profile data and mark onboarding complete
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

      if (!profileRes.ok) {
        throw new Error("Failed to save profile");
      }

      // 3. Mark onboarding complete
      const completeRes = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      if (!completeRes.ok) {
        throw new Error("Failed to complete onboarding");
      }

      toast.success("Profile set up successfully! 🎉");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to save profile. Please try again.");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CareerAI</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Set Up Your Profile</h1>
          <p className="text-muted-foreground">
            Step {currentStep} of {steps.length} — {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                      ? "text-emerald-400 cursor-pointer"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                      isCurrent
                        ? "gradient-primary text-white"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted text-muted-foreground/50"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-medium hidden sm:block">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 rounded-2xl glass-strong min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              className="gradient-primary text-white border-0 gap-2 hover:opacity-90"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="gradient-primary text-white border-0 gap-2 hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
