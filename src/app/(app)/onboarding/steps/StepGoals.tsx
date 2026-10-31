"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code2,
  Server,
  Layers,
  BarChart2,
  Cpu,
  Terminal,
  Smartphone,
  Cloud,
  ShieldCheck,
  Briefcase,
  Compass,
  Database,
  Check,
  Plus,
  X,
} from "lucide-react";
import type { OnboardingFormData } from "@/types";

interface Props {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

const goalOptions = [
  { value: "frontend_developer", label: "Frontend Developer", icon: Code2 },
  { value: "backend_developer", label: "Backend Developer", icon: Server },
  { value: "fullstack_developer", label: "Full-Stack Developer", icon: Layers },
  { value: "data_scientist", label: "Data Scientist", icon: BarChart2 },
  { value: "ml_engineer", label: "ML Engineer", icon: Cpu },
  { value: "devops_engineer", label: "DevOps Engineer", icon: Terminal },
  { value: "mobile_developer", label: "Mobile Developer", icon: Smartphone },
  { value: "cloud_engineer", label: "Cloud Engineer", icon: Cloud },
  { value: "cybersecurity", label: "Cybersecurity", icon: ShieldCheck },
  { value: "product_manager", label: "Product Manager", icon: Briefcase },
  { value: "ui_ux_designer", label: "UI/UX Designer", icon: Compass },
  { value: "blockchain_developer", label: "Blockchain Developer", icon: Database },
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
  };

  const removeLocation = (location: string) => {
    updateFormData({
      preferred_locations: formData.preferred_locations.filter((l) => l !== location),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Goals & Preferences</h2>
        <p className="text-xs text-[#8A96AA]">
          What career path interests you? Select all that apply.
        </p>
      </div>

      {/* Career Goals */}
      <div className="space-y-2">
        <Label className="text-xs font-mono text-[#8A96AA]">Career Goals (select multiple)</Label>
        <div className="grid grid-cols-2 gap-2">
          {goalOptions.map((goal) => {
            const isSelected = formData.goals.includes(goal.value);
            const Icon = goal.icon;
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`flex items-center gap-2.5 p-3 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-500/10 border border-blue-500/30 text-white font-semibold shadow-xs"
                    : "bg-[#0A0C13] border border-white/[0.06] text-[#8A96AA] hover:border-white/[0.14] hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-400" : "text-[#64748B]"}`} />
                <span className="flex-1 truncate">{goal.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Role */}
      <div className="space-y-2">
        <Label className="text-xs font-mono text-[#8A96AA]">Primary Target Role *</Label>
        <Select
          value={formData.preferred_role}
          onValueChange={(value) => updateFormData({ preferred_role: value || "" })}
        >
          <SelectTrigger className="w-full h-9.5 bg-[#0A0C13] border-white/[0.1] rounded-lg text-xs sm:text-sm text-white">
            <SelectValue placeholder="Select target role" />
          </SelectTrigger>
          <SelectContent className="bg-[#0E111A] border-white/[0.1] text-white text-xs">
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role} className="focus:bg-blue-600">
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2">
        <Label className="text-xs font-mono text-[#8A96AA]">Preferred Locations</Label>
        {formData.preferred_locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {formData.preferred_locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-[#0A0C13] border border-white/[0.08] text-slate-200"
              >
                {loc}
                <button
                  type="button"
                  onClick={() => removeLocation(loc)}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Select onValueChange={(val) => typeof val === "string" && val && addLocation(val)}>
          <SelectTrigger className="w-full h-9.5 bg-[#0A0C13] border-white/[0.1] rounded-lg text-xs sm:text-sm text-white">
            <SelectValue placeholder="Add a preferred location..." />
          </SelectTrigger>
          <SelectContent className="bg-[#0E111A] border-white/[0.1] text-white text-xs">
            {locationOptions
              .filter((loc) => !formData.preferred_locations.includes(loc))
              .map((loc) => (
                <SelectItem key={loc} value={loc} className="focus:bg-blue-600">
                  {loc}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
