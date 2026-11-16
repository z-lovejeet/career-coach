"use client";

import { ArrowLeft, Check, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prettyLabel, Tag } from "@/components/workspace/ui";
import type { OnboardingFormData } from "@/types";

const linkFields = [
  {
    key: "github_url",
    label: "GitHub",
    placeholder: "https://github.com/username",
    description: "Code, contributions, and the work behind your projects.",
  },
  {
    key: "linkedin_url",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    description: "Your professional background and experience.",
  },
  {
    key: "portfolio_url",
    label: "Portfolio",
    placeholder: "https://yourportfolio.com",
    description: "A personal collection of the work you want to share.",
  },
] as const;

export default function StepLinks({
  formData,
  updateFormData,
  attached,
  onEdit,
}: {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  attached: boolean;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Your story, all together.</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Add the places where your work lives, then give your profile a final
          look.
        </p>
      </div>
      <div className="grid gap-5">
        {linkFields.map(({ key, label, placeholder, description }) => (
          <label key={key} className="grid gap-2 text-sm font-medium">
            <span>
              {label}
              <span className="ml-2 font-normal text-muted-foreground">
                Optional
              </span>
            </span>
            <Input
              inputMode="url"
              value={formData[key]}
              placeholder={placeholder}
              onChange={(event) =>
                updateFormData({ [key]: event.target.value })
              }
            />
            <span className="text-xs font-normal leading-relaxed text-muted-foreground">
              {description}
            </span>
          </label>
        ))}
      </div>
      <div className="space-y-5 border-t border-border pt-7">
        <div>
          <h3 className="text-xl font-semibold">Your profile preview</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            These are the details you’re about to save. Use Edit to revisit a
            section.
          </p>
        </div>
        <section className="rounded-2xl border border-border bg-background/20 p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold">
                {formData.full_name || "Your name"}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {formData.preferred_role || "Target role to be added"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Edit your background"
              onClick={() => onEdit(0)}
            >
              <Pencil />
              Edit
            </Button>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              [
                "Education",
                [formData.education_level, formData.field_of_study]
                  .filter(Boolean)
                  .join(" · ") || "Not added",
              ],
              [
                "Experience",
                prettyLabel(formData.experience_level) || "Not added",
              ],
              ["Email", formData.email || "Provided by your sign-in method"],
              [
                "Preferred locations",
                formData.preferred_locations.join(", ") || "Open to exploring",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-2xl border border-border bg-background/20 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-semibold">Skills & confidence</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Edit your skills"
              onClick={() => onEdit(2)}
            >
              <Pencil />
              Edit
            </Button>
          </div>
          {formData.skills.length ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <Tag key={skill}>
                  {skill}
                  <span className="ml-1.5 tabular-nums text-primary">
                    {formData.skill_ratings[skill] ?? 5}/10
                  </span>
                </Tag>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You can add your first skills from your profile later.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-background/20 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-semibold">Projects</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Edit your projects"
              onClick={() => onEdit(3)}
            >
              <Pencil />
              Edit
            </Button>
          </div>
          {formData.projects.length ? (
            <ul className="space-y-4">
              {formData.projects.map((project, index) => (
                <li key={index}>
                  <p className="break-words text-sm font-semibold">
                    {project.name}
                  </p>
                  {project.description && (
                    <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  {project.tech?.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.tech.join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your projects can grow with your practice. Add them whenever
              you’re ready.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-background/20 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-semibold">Career direction</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Edit your career goals"
              onClick={() => onEdit(4)}
            >
              <Pencil />
              Edit
            </Button>
          </div>
          {formData.goals.length ? (
            <div className="flex flex-wrap gap-2">
              {formData.goals.map((goal) => (
                <Tag key={goal} tone="accent">
                  {prettyLabel(goal)}
                </Tag>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add a goal later as you explore the workspace.
            </p>
          )}
        </section>
        <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
          <FileText className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm">
            {attached
              ? "Your resume PDF is attached to your account."
              : "You’re starting with the details entered here."}
          </p>
          {attached ? (
            <Check className="size-4 shrink-0 text-primary" />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onEdit(1)}
            >
              <ArrowLeft />
              Add resume
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
