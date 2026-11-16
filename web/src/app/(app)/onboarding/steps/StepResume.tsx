"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResumeControl,
  type ResumeExtract,
} from "@/components/workspace/resume-control";
import { Tag } from "@/components/workspace/ui";
import type { OnboardingFormData } from "@/types";

export default function StepResume({
  formData,
  updateFormData,
  attached,
  setAttached,
  setBusy,
}: {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  attached: boolean;
  setAttached: (attached: boolean) => void;
  setBusy: (busy: boolean) => void;
}) {
  const [analysis, setAnalysis] = useState<ResumeExtract | null>(null);

  function useExtractedDetails() {
    if (!analysis) return;
    const skills = (analysis.skills ?? []).filter(
      (skill) => typeof skill === "string",
    );
    const projects = (analysis.projects ?? []).filter(
      (project) =>
        typeof project.name === "string" &&
        !formData.projects.some(
          ({ name }) => name.toLowerCase() === project.name.toLowerCase(),
        ),
    );
    updateFormData({
      full_name: formData.full_name || analysis.full_name || "",
      education_level:
        formData.education_level || analysis.education_level || "",
      field_of_study: formData.field_of_study || analysis.field_of_study || "",
      experience_level:
        formData.experience_level || analysis.experience_level || "fresher",
      preferred_role: formData.preferred_role || analysis.preferred_role || "",
      skills: [...new Set([...formData.skills, ...skills])],
      skill_ratings: { ...analysis.skill_ratings, ...formData.skill_ratings },
      projects: [...formData.projects, ...projects],
    });
    setAnalysis(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">
          Bring your experience with you.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF to extract skills and projects you can review before
          adding them. You can also skip this step.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/20 p-4">
          <h3 className="text-sm font-semibold">Keep the useful details</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Check that your recent work, project contributions, and technical
            skills are clearly described.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background/20 p-4">
          <h3 className="text-sm font-semibold">You choose what gets added</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The PDF is saved when you upload it. Extracted details are suggested
            separately for your review.
          </p>
        </div>
      </div>
      <ResumeControl
        attached={attached}
        onBusyChange={setBusy}
        onChange={(value, extracted) => {
          setAttached(value);
          setAnalysis(extracted ?? null);
        }}
      />
      {analysis && (
        <div className="space-y-3 rounded-2xl border border-border bg-background/60 p-4">
          <h3 className="font-semibold">Suggested details</h3>
          {analysis.summary && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Tag>{analysis.skills?.length ?? 0} skills</Tag>
            <Tag>{analysis.projects?.length ?? 0} projects</Tag>
          </div>
          <Button type="button" onClick={useExtractedDetails}>
            Add to profile draft
          </Button>
        </div>
      )}
    </div>
  );
}
