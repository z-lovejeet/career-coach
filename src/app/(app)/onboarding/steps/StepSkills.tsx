"use client";

import { useState } from "react";
import { Gauge, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OnboardingFormData } from "@/types";

const suggestedSkills = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Git",
  "Docker",
  "AWS",
  "Linux",
  "Algorithms",
  "System Design",
  "Communication",
];

export default function StepSkills({
  formData,
  updateFormData,
}: {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(skill: string) {
    const name = skill.trim();
    if (
      !name ||
      formData.skills.some(
        (entry) => entry.toLowerCase() === name.toLowerCase(),
      )
    )
      return;
    updateFormData({
      skills: [...formData.skills, name],
      skill_ratings: { ...formData.skill_ratings, [name]: 5 },
    });
    setDraft("");
  }

  function remove(skill: string) {
    const ratings = { ...formData.skill_ratings };
    delete ratings[skill];
    updateFormData({
      skills: formData.skills.filter((value) => value !== skill),
      skill_ratings: ratings,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">What can you do?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your skills and rate how confident you feel in each one.
        </p>
      </div>
      <div className="rounded-2xl border border-primary/12 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="size-4 text-primary" />A guide to your confidence
          rating
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            [
              "1–3",
              "Learning the basics",
              "You understand the ideas and are building familiarity.",
            ],
            [
              "4–6",
              "Putting it to use",
              "You can build with the skill and sometimes need a reference.",
            ],
            [
              "7–10",
              "Working independently",
              "You can explain trade-offs and solve unfamiliar problems.",
            ],
          ].map(([range, title, description]) => (
            <div key={range}>
              <dt className="text-sm font-semibold">
                <span className="mr-2 text-primary">{range}</span>
                {title}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          add(draft);
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grid min-w-40 flex-1 gap-2 text-sm font-medium">
          Skill
          <Input
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. TypeScript"
          />
        </label>
        <Button type="submit" disabled={!draft.trim()}>
          <Plus />
          Add skill
        </Button>
      </form>
      <p className="text-sm font-medium">Or start with a skill you use</p>
      <div className="flex flex-wrap gap-2" aria-label="Suggested skills">
        {suggestedSkills
          .filter((skill) => !formData.skills.includes(skill))
          .map((skill) => (
            <Button
              key={skill}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => add(skill)}
            >
              <Plus />
              {skill}
            </Button>
          ))}
      </div>
      {formData.skills.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {formData.skills.map((skill, index) => (
            <li
              key={`${skill}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background/20 p-4"
            >
              <label className="min-w-0 flex-1">
                <span className="flex justify-between gap-2 text-sm">
                  <span className="break-words font-medium">{skill}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formData.skill_ratings[skill] ?? 5}/10
                  </span>
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.skill_ratings[skill] ?? 5}
                  aria-label={`${skill} proficiency`}
                  onChange={(event) =>
                    updateFormData({
                      skill_ratings: {
                        ...formData.skill_ratings,
                        [skill]: Number(event.target.value),
                      },
                    })
                  }
                  className="mt-2 w-full accent-primary"
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${skill}`}
                onClick={() => remove(skill)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
