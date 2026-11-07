"use client";

import { useState } from "react";
import { FolderOpen, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Notice, safeHttpUrl, Tag } from "@/components/workspace/ui";
import type { OnboardingFormData, Project } from "@/types";

const empty = { name: "", tech: "", description: "", url: "" };

export default function StepProjects({
  formData,
  updateFormData,
}: {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState(empty);
  const [urlError, setUrlError] = useState(false);

  function open(project?: Project, currentIndex = -1) {
    setDraft(
      project
        ? {
            name: project.name,
            tech: project.tech?.join(", ") || "",
            description: project.description,
            url: project.url ?? "",
          }
        : empty,
    );
    setIndex(currentIndex);
    setUrlError(false);
  }

  function save() {
    const url = draft.url.trim();
    if (url && !safeHttpUrl(url)) {
      setUrlError(true);
      return;
    }
    const project: Project = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      tech: [
        ...new Set(
          draft.tech
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ],
      url: url || undefined,
    };
    updateFormData({
      projects:
        index === -1
          ? [...formData.projects, project]
          : formData.projects.map((item, itemIndex) =>
              itemIndex === index ? project : item,
            ),
    });
    setIndex(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Show what you’ve built.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add coursework, side projects, or work you’re proud to share.
          </p>
        </div>
        {index === null && (
          <Button type="button" variant="outline" onClick={() => open()}>
            <Plus />
            Add project
          </Button>
        )}
      </div>
      <div className="rounded-2xl border border-primary/12 bg-primary/5 p-4">
        <h3 className="text-sm font-semibold">
          Make each project tell a story
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Describe who it helped, what you built, and the result or lesson.
          Mention one technical decision you could explain in an interview.
        </p>
      </div>
      {index === null && !formData.projects.length && (
        <Notice
          icon={FolderOpen}
          title="Your projects will appear here"
          description="A project is optional. You can add one later from your profile."
        />
      )}
      {index !== null && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="grid gap-4 rounded-2xl border border-border bg-background/45 p-4 sm:grid-cols-2"
        >
          <label className="grid gap-2 text-sm font-medium">
            Project name
            <Input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Project link (optional)
            <Input
              inputMode="url"
              value={draft.url}
              aria-invalid={urlError}
              onChange={(event) => {
                setDraft({ ...draft, url: event.target.value });
                setUrlError(false);
              }}
            />
          </label>
          {urlError && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              Enter a link starting with https:// or http://.
            </p>
          )}
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            Technologies
            <Input
              value={draft.tech}
              onChange={(event) =>
                setDraft({ ...draft, tech: event.target.value })
              }
              placeholder="React, TypeScript, PostgreSQL"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            What did you make?
            <Textarea
              rows={4}
              placeholder="I built… to help… My contribution was…"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={!draft.name.trim()}>
              Save project
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIndex(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {formData.projects.map((project, projectIndex) => (
          <li
            key={projectIndex}
            className="flex items-start gap-3 rounded-2xl border border-border p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="break-words font-medium">{project.name}</p>
              {project.description && (
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              {!!project.tech?.length && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tech.map((tech, techIndex) => (
                    <Tag key={techIndex}>{tech}</Tag>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Edit ${project.name}`}
              disabled={index !== null}
              onClick={() => open(project, projectIndex)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${project.name}`}
              disabled={index !== null}
              onClick={() =>
                updateFormData({
                  projects: formData.projects.filter(
                    (_, currentIndex) => currentIndex !== projectIndex,
                  ),
                })
              }
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
