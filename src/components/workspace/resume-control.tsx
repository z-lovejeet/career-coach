"use client";

import { useId, useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconTile } from "./ui";
import { request } from "./api";

export type ResumeExtract = {
  skills: string[];
  skill_ratings: Record<string, number>;
  projects: { name: string; tech: string[]; description: string; url?: string }[];
  education_level: string;
  field_of_study: string;
  experience_level: string;
  preferred_role: string;
  full_name: string;
  summary: string;
};

export function ResumeControl({ attached, onChange, onBusyChange }: {
  attached: boolean;
  onChange: (attached: boolean, analysis?: ResumeExtract | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [dragging, setDragging] = useState(false);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useRef(false);

  async function update(file?: File) {
    if (pending.current) return;
    setError("");
    setNotice("");
    if (file && (file.type !== "application/pdf" || file.size > 4 * 1024 * 1024)) {
      setError("Choose a PDF that is 4 MB or smaller.");
      return;
    }

    pending.current = true;
    setBusy(file ? "upload" : "remove");
    onBusyChange?.(true);
    try {
      if (file) {
        const body = new FormData();
        body.set("resume", file);
        const result = await request<{ analysis: ResumeExtract | null }>("/api/onboarding/resume", { method: "POST", body });
        onChange(true, result.analysis);
        setNotice("Resume attached.");
      } else {
        await request("/api/onboarding/resume", { method: "DELETE" });
        onChange(false);
        setNotice("Resume removed.");
      }
      setConfirming(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The resume could not be updated.");
    } finally {
      pending.current = false;
      setBusy(null);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition-colors ${dragging ? "border-primary bg-primary/10" : "border-border bg-background/50"}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void update(file);
        }}
      >
        <IconTile icon={FileText} />
        <div className="min-w-36 flex-1">
          <p className="font-medium">{attached ? "Resume attached" : "Upload your resume"}</p>
          <p id={id} className="mt-1 text-xs text-muted-foreground">PDF document, up to 4 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void update(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={attached ? "outline" : "default"} disabled={!!busy} aria-describedby={id} onClick={() => inputRef.current?.click()}>
            {busy === "upload" ? <Loader2 className="motion-safe:animate-spin" /> : <Upload />}
            {busy === "upload" ? "Uploading…" : attached ? "Replace PDF" : "Choose PDF"}
          </Button>
          {attached && (
            <>
              <a className={buttonVariants({ variant: "outline" })} href="/api/onboarding/resume" target="_blank" rel="noreferrer">Open PDF</a>
              <Button type="button" variant="ghost" size="icon" disabled={!!busy} aria-label="Remove resume" onClick={() => setConfirming(true)}><X /></Button>
            </>
          )}
        </div>
      </div>
      {confirming && attached && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-3">
          <p className="text-sm">Remove the attached PDF from your account?</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={!!busy} onClick={() => setConfirming(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={!!busy} onClick={() => void update()}>{busy === "remove" ? "Removing…" : "Remove PDF"}</Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    </div>
  );
}
