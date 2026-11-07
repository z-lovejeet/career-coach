"use client";

import { Input } from "@/components/ui/input";
import { selectClass } from "@/components/workspace/ui";
import type { OnboardingFormData } from "@/types";

const educationLevels = [
  "High School",
  "Diploma",
  "B.Tech / B.E.",
  "B.Sc",
  "BCA",
  "M.Tech / M.E.",
  "M.Sc",
  "MCA",
  "MBA",
  "PhD",
  "Other",
];
const fieldsOfStudy = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Mathematics",
  "Physics",
  "Commerce",
  "Other",
];
const experienceLevels = [
  { value: "fresher", label: "Starting out" },
  { value: "intern", label: "Internship or part-time" },
  { value: "0-1", label: "0–1 years" },
  { value: "1-3", label: "1–3 years" },
  { value: "3+", label: "3+ years" },
];

export default function StepBasicInfo({
  formData,
  updateFormData,
}: {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Tell us about yourself.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your background helps tailor the pace and focus of your practice.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Full name
          <Input
            autoComplete="name"
            aria-required="true"
            value={formData.full_name}
            onChange={(event) =>
              updateFormData({ full_name: event.target.value })
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Account email
          <Input
            type="email"
            readOnly
            value={formData.email}
            placeholder="Provided by your sign-in method"
            className="text-muted-foreground"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Phone (optional)
          <Input
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(event) => updateFormData({ phone: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Education
          <select
            className={selectClass}
            value={formData.education_level}
            onChange={(event) =>
              updateFormData({ education_level: event.target.value })
            }
          >
            <option value="">Select education</option>
            {formData.education_level &&
              !educationLevels.includes(formData.education_level) && (
                <option value={formData.education_level}>
                  {formData.education_level}
                </option>
              )}
            {educationLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Field of study
          <select
            className={selectClass}
            value={formData.field_of_study}
            onChange={(event) =>
              updateFormData({ field_of_study: event.target.value })
            }
          >
            <option value="">Select a field</option>
            {formData.field_of_study &&
              !fieldsOfStudy.includes(formData.field_of_study) && (
                <option value={formData.field_of_study}>
                  {formData.field_of_study}
                </option>
              )}
            {fieldsOfStudy.map((field) => (
              <option key={field}>{field}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Experience
          <select
            className={selectClass}
            value={formData.experience_level}
            onChange={(event) =>
              updateFormData({ experience_level: event.target.value })
            }
          >
            {!experienceLevels.some(
              ({ value }) => value === formData.experience_level,
            ) && (
              <option value={formData.experience_level}>
                {formData.experience_level}
              </option>
            )}
            {experienceLevels.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
