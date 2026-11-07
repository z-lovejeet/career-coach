"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prettyLabel } from "@/components/workspace/ui";
import type { OnboardingFormData } from "@/types";

const options = [
  "frontend_developer",
  "backend_developer",
  "fullstack_developer",
  "data_scientist",
  "ml_engineer",
  "devops_engineer",
  "mobile_developer",
  "cloud_engineer",
  "cybersecurity",
  "product_manager",
  "ui_ux_designer",
  "blockchain_developer",
];

export default function StepGoals({
  formData,
  updateFormData,
}: {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}) {
  const [location, setLocation] = useState("");
  const goals = [...new Set([...options, ...formData.goals])];

  function addLocation() {
    const place = location.trim();
    if (place && !formData.preferred_locations.includes(place))
      updateFormData({
        preferred_locations: [...formData.preferred_locations, place],
      });
    setLocation("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Where do you want to go?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a few areas that interest you and describe the role you’re
          aiming for.
        </p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Areas of interest</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {goals.map((goal) => {
            const selected = formData.goals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  updateFormData({
                    goals: selected
                      ? formData.goals.filter((item) => item !== goal)
                      : [...formData.goals, goal],
                  })
                }
                className={`flex min-h-11 items-center gap-2 rounded-xl border p-2.5 text-left text-sm font-medium transition-colors ${selected ? "border-primary/25 bg-primary/8 text-primary" : "border-border bg-background/50 text-muted-foreground hover:bg-primary/5"}`}
              >
                {selected ? (
                  <Check className="size-4 shrink-0" />
                ) : (
                  <Plus className="size-4 shrink-0 opacity-60" />
                )}
                {prettyLabel(goal)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Choose the interests you want to explore. A specific target role and
        preferred locations give your preparation a clearer direction.
      </p>
      <label className="grid gap-2 text-sm font-medium">
        Target role
        <Input
          value={formData.preferred_role}
          onChange={(event) =>
            updateFormData({ preferred_role: event.target.value })
          }
          placeholder="e.g. Software Engineer"
        />
      </label>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          addLocation();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grid min-w-40 flex-1 gap-2 text-sm font-medium">
          Preferred locations
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Bengaluru or Remote"
          />
        </label>
        <Button type="submit" variant="outline" disabled={!location.trim()}>
          <Plus />
          Add location
        </Button>
      </form>
      {formData.preferred_locations.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {formData.preferred_locations.map((place) => (
            <li key={place}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Remove ${place}`}
                onClick={() =>
                  updateFormData({
                    preferred_locations: formData.preferred_locations.filter(
                      (value) => value !== place,
                    ),
                  })
                }
              >
                {place}
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
