"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Plus, X } from "lucide-react";
import type { OnboardingFormData } from "@/types";

interface Props {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

const goalOptions = [
  { value: "frontend_developer", label: "Frontend Developer", emoji: "🎨" },
  { value: "backend_developer", label: "Backend Developer", emoji: "⚙️" },
  { value: "fullstack_developer", label: "Full-Stack Developer", emoji: "🔥" },
  { value: "data_scientist", label: "Data Scientist", emoji: "📊" },
  { value: "ml_engineer", label: "ML Engineer", emoji: "🤖" },
  { value: "devops_engineer", label: "DevOps Engineer", emoji: "🚀" },
  { value: "mobile_developer", label: "Mobile Developer", emoji: "📱" },
  { value: "cloud_engineer", label: "Cloud Engineer", emoji: "☁️" },
  { value: "cybersecurity", label: "Cybersecurity", emoji: "🔒" },
  { value: "product_manager", label: "Product Manager", emoji: "📋" },
  { value: "ui_ux_designer", label: "UI/UX Designer", emoji: "✏️" },
  { value: "blockchain_developer", label: "Blockchain Developer", emoji: "🔗" },
];

const roleOptions = [
  "Software Development Engineer (SDE)",
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Data Analyst",
  "Data Scientist",
  "ML Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Mobile Developer",
  "QA Engineer",
  "Product Manager",
];

const locationOptions = [
  "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi NCR",
  "Chennai", "Kolkata", "Ahmedabad", "Remote", "Anywhere in India",
  "International",
];

export default function StepGoals({ formData, updateFormData }: Props) {
  const [locationInput, setLocationInput] = useState("");

  const toggleGoal = (goal: string) => {
    const newGoals = formData.goals.includes(goal)
      ? formData.goals.filter((g) => g !== goal)
      : [...formData.goals, goal];
    updateFormData({ goals: newGoals });
  };

  const addLocation = (location: string) => {
    const trimmed = location.trim();
    if (!trimmed || formData.preferred_locations.includes(trimmed)) return;
    updateFormData({
      preferred_locations: [...formData.preferred_locations, trimmed],
    });
    setLocationInput("");
  };

  const removeLocation = (location: string) => {
    updateFormData({
      preferred_locations: formData.preferred_locations.filter((l) => l !== location),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Goals & Preferences</h2>
        <p className="text-sm text-muted-foreground">
          What career path interests you? Select all that apply.
        </p>
      </div>

      {/* Career Goals */}
      <div className="space-y-2">
        <Label>Career Goals (select multiple)</Label>
        <div className="grid grid-cols-2 gap-2">
          {goalOptions.map((goal) => {
            const isSelected = formData.goals.includes(goal.value);
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm text-left transition-all duration-200 ${
                  isSelected
                    ? "bg-primary/15 border border-primary/30 text-foreground"
                    : "bg-accent/50 border border-border text-muted-foreground hover:border-primary/20"
                }`}
              >
                <span>{goal.emoji}</span>
                <span className="flex-1 text-xs font-medium">{goal.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Role */}
      <div className="space-y-2">
        <Label>Preferred Job Title</Label>
        <Select
          value={formData.preferred_role}
          onValueChange={(value) => updateFormData({ preferred_role: value || "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select preferred role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2">
        <Label>Preferred Locations</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {locationOptions
            .filter((l) => !formData.preferred_locations.includes(l))
            .slice(0, 8)
            .map((location) => (
              <Badge
                key={location}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                onClick={() => addLocation(location)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {location}
              </Badge>
            ))}
        </div>
        {formData.preferred_locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formData.preferred_locations.map((location) => (
              <Badge
                key={location}
                className="bg-primary/15 text-primary border-primary/30 cursor-pointer hover:bg-destructive/15 hover:text-destructive transition-colors text-xs"
                onClick={() => removeLocation(location)}
              >
                {location}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
