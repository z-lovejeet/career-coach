"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, FolderKanban, Trash2 } from "lucide-react";
import type { OnboardingFormData, Project } from "@/types";

interface Props {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

const emptyProject: Project = {
  name: "",
  tech: [],
  description: "",
  url: "",
};

export default function StepProjects({ formData, updateFormData }: Props) {
  const [editingProject, setEditingProject] = useState<Project>({ ...emptyProject });
  const [techInput, setTechInput] = useState("");
  const [showForm, setShowForm] = useState(formData.projects.length === 0);

  const addTech = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed || editingProject.tech.includes(trimmed)) return;
    setEditingProject((prev) => ({ ...prev, tech: [...prev.tech, trimmed] }));
    setTechInput("");
  };

  const removeTech = (tech: string) => {
    setEditingProject((prev) => ({
      ...prev,
      tech: prev.tech.filter((t) => t !== tech),
    }));
  };

  const saveProject = () => {
    if (!editingProject.name.trim()) return;
    const newProjects = [...formData.projects, editingProject];
    updateFormData({ projects: newProjects });
    setEditingProject({ ...emptyProject });
    setTechInput("");
    setShowForm(false);
  };

  const removeProject = (index: number) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    updateFormData({ projects: newProjects });
    if (newProjects.length === 0) setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Projects</h2>
        <p className="text-sm text-muted-foreground">
          Add projects you&apos;ve built. These help the AI understand your practical experience.
        </p>
      </div>

      {/* Existing projects */}
      {formData.projects.length > 0 && (
        <div className="space-y-3">
          {formData.projects.map((project, i) => (
            <div key={i} className="p-4 rounded-xl bg-accent/50 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.tech.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tech.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => removeProject(i)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add project form */}
      {showForm ? (
        <div className="p-4 rounded-xl border border-border space-y-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input
              placeholder="e.g., E-commerce Platform"
              value={editingProject.name}
              onChange={(e) =>
                setEditingProject((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of what you built..."
              value={editingProject.description}
              onChange={(e) =>
                setEditingProject((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Technologies Used</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., React (press Enter)"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech(techInput);
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => addTech(techInput)}
                disabled={!techInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {editingProject.tech.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {editingProject.tech.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20 text-xs"
                    onClick={() => removeTech(t)}
                  >
                    {t}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Project URL (optional)</Label>
            <Input
              placeholder="https://github.com/..."
              value={editingProject.url}
              onChange={(e) =>
                setEditingProject((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveProject}
              disabled={!editingProject.name.trim()}
              className="gradient-primary text-white border-0 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Project
            </Button>
            {formData.projects.length > 0 && (
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full py-6 border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Project
        </Button>
      )}

      {formData.projects.length === 0 && !showForm && (
        <div className="p-8 rounded-xl border border-dashed border-border text-center">
          <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No projects added yet. Click above to add one.
          </p>
        </div>
      )}
    </div>
  );
}
