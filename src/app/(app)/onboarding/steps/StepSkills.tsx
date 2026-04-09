"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, X, Code2 } from "lucide-react";
import type { OnboardingFormData } from "@/types";

interface Props {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

const suggestedSkills = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C",
  "React", "Next.js", "Node.js", "Express.js", "Angular", "Vue.js",
  "HTML", "CSS", "Tailwind CSS",
  "MongoDB", "PostgreSQL", "MySQL", "Firebase", "Supabase",
  "Git", "Docker", "AWS", "Linux",
  "Data Structures", "Algorithms", "System Design",
  "Machine Learning", "Deep Learning", "NLP",
  "REST API", "GraphQL",
  "Communication", "Problem Solving", "Leadership",
];

export default function StepSkills({ formData, updateFormData }: Props) {
  const [newSkill, setNewSkill] = useState("");

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || formData.skills.includes(trimmed)) return;

    const newSkills = [...formData.skills, trimmed];
    const newRatings = { ...formData.skill_ratings, [trimmed]: 5 };
    updateFormData({ skills: newSkills, skill_ratings: newRatings });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    const newSkills = formData.skills.filter((s) => s !== skill);
    const newRatings = { ...formData.skill_ratings };
    delete newRatings[skill];
    updateFormData({ skills: newSkills, skill_ratings: newRatings });
  };

  const updateRating = (skill: string, value: number[]) => {
    updateFormData({
      skill_ratings: { ...formData.skill_ratings, [skill]: value[0] },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(newSkill);
    }
  };

  const availableSuggestions = suggestedSkills.filter(
    (s) => !formData.skills.includes(s)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Your Skills</h2>
        <p className="text-sm text-muted-foreground">
          Add your technical and soft skills, then rate your proficiency (1-10)
        </p>
      </div>

      {/* Add skill input */}
      <div className="flex gap-2">
        <Input
          placeholder="Type a skill and press Enter..."
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => addSkill(newSkill)}
          disabled={!newSkill.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggested skills */}
      {availableSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.slice(0, 15).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                onClick={() => addSkill(skill)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Skills with ratings */}
      {formData.skills.length > 0 ? (
        <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
          {formData.skills.map((skill) => (
            <div
              key={skill}
              className="p-3 rounded-xl bg-accent/50 border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{skill}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {formData.skill_ratings[skill] || 5}/10
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSkill(skill)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[formData.skill_ratings[skill] || 5]}
                onValueChange={(value) => {
                  const num = typeof value === 'number' ? value : value[0];
                  updateFormData({ skill_ratings: { ...formData.skill_ratings, [skill]: num } });
                }}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-dashed border-border text-center">
          <Code2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No skills added yet. Type above or click suggestions to add.
          </p>
        </div>
      )}

      {formData.skills.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {formData.skills.length} skill{formData.skills.length !== 1 ? "s" : ""} added
        </p>
      )}
    </div>
  );
}
