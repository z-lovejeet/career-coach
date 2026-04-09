"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingFormData } from "@/types";

interface Props {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

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
  { value: "fresher", label: "Fresher (No experience)" },
  { value: "intern", label: "Intern / Part-time experience" },
  { value: "0-1", label: "0-1 years" },
  { value: "1-3", label: "1-3 years" },
  { value: "3+", label: "3+ years" },
];

export default function StepBasicInfo({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Tell us about yourself</h2>
        <p className="text-sm text-muted-foreground">
          Basic information to personalize your career roadmap
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={(e) => updateFormData({ full_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Education Level *</Label>
          <Select
            value={formData.education_level || undefined}
            onValueChange={(value: string | null) => updateFormData({ education_level: value || '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select education" />
            </SelectTrigger>
            <SelectContent>
              {educationLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Field of Study *</Label>
          <Select
            value={formData.field_of_study || undefined}
            onValueChange={(value: string | null) => updateFormData({ field_of_study: value || '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {fieldsOfStudy.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Experience Level *</Label>
          <Select
            value={formData.experience_level || undefined}
            onValueChange={(value: string | null) => updateFormData({ experience_level: value || 'fresher' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
