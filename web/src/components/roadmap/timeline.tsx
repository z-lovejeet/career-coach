"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Circle, CircleDot, FlaskConical, Plus, Trash2 } from "lucide-react";
import { Button, Input, Select } from "@/components/ui/primitives";
import type { NodeStatus, RoadmapGraph, RoadmapNode } from "@/lib/types";
import { isWork } from "@/lib/roadmap-ops";
import { cn, courseSearchLinks, uid } from "@/lib/utils";

const NEXT: Record<NodeStatus, NodeStatus> = { todo: "doing", doing: "done", done: "todo" };

export function StatusButton({ status, onChange, size = "md" }: { status: NodeStatus; onChange: (s: NodeStatus) => void; size?: "sm" | "md" }) {
  const label = status === "done" ? "Done — mark as to do" : status === "doing" ? "In progress — mark as done" : "To do — mark as in progress";
  return (
    <button type="button" aria-label={label} title={label} onClick={() => onChange(NEXT[status])}
      className={cn("grid shrink-0 place-items-center rounded-full border transition-colors", size === "sm" ? "size-5" : "size-6",
        status === "done" ? "border-success bg-success text-white" : status === "doing" ? "border-warm text-warm" : "border-line-strong text-transparent hover:border-accent")}>
      {status === "done" ? <Check className="size-3.5" /> : status === "doing" ? <CircleDot className="size-3.5" /> : <Circle className="size-3" />}
    </button>
  );
}

export function Timeline({ graph, onChange, selected, onSelect }: {
  graph: RoadmapGraph; onChange: (g: RoadmapGraph, note: string) => void; selected: string | null; onSelect: (id: string) => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", kind: "course" as "course" | "project", weeks: 2 });

  const mutate = (fn: (g: RoadmapGraph) => void, note: string) => {
    const g = structuredClone(graph);
    fn(g);
    onChange(g, note);
  };

  const move = (node: RoadmapNode, dir: -1 | 1) => mutate((g) => {
    const siblings = g.nodes.filter((n) => n.phaseId === node.phaseId && isWork(n));
    const i = siblings.findIndex((n) => n.id === node.id);
    const swap = siblings[i + dir];
    if (!swap) return;
    const a = g.nodes.findIndex((n) => n.id === node.id), b = g.nodes.findIndex((n) => n.id === swap.id);
    [g.nodes[a], g.nodes[b]] = [g.nodes[b], g.nodes[a]];
  }, `Reordered “${node.title}”`);

  const add = (phaseId: string) => {
    if (!draft.title.trim()) return;
    mutate((g) => {
      g.nodes.push({
        id: `${draft.kind[0]}-${uid()}`, kind: draft.kind, title: draft.title.trim(), description: "", phaseId, weeks: draft.weeks, status: "todo",
        custom: true, skillIds: [], links: draft.kind === "course" ? courseSearchLinks(draft.title.trim()) : undefined,
      });
    }, `Added “${draft.title.trim()}”`);
    setDraft({ title: "", kind: "course", weeks: 2 });
    setAdding(null);
  };

  return (
    <ol className="space-y-4">
      {graph.phases.map((phase, pi) => {
        const items = graph.nodes.filter((n) => n.phaseId === phase.id && isWork(n));
        const done = items.filter((n) => n.status === "done").length;
        return (
          <li key={phase.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface-2 px-5 py-4">
              <div className="min-w-0">
                <p className="num text-[11px] text-faint">PHASE {pi + 1} · WEEKS {phase.startWeek}–{phase.startWeek + phase.weeks - 1}</p>
                <h3 className="mt-1 text-[16px] font-semibold text-ink">{phase.title}</h3>
                <p className="mt-0.5 text-[13px] text-muted">{phase.goal}</p>
              </div>
              <span className="num rounded-md bg-surface px-2 py-1 text-xs text-ink-2 ring-1 ring-line">{done}/{items.length}</span>
            </div>
            <ul className="divide-y divide-line">
              {items.map((n, i) => (
                <li key={n.id} className={cn("group flex items-center gap-3 px-5 py-3 transition-colors", selected === n.id ? "bg-accent-soft/50" : "hover:bg-surface-2")}>
                  <StatusButton status={n.status} onChange={(status) => mutate((g) => { g.nodes.find((x) => x.id === n.id)!.status = status; }, `${status === "done" ? "Completed" : "Updated"} “${n.title}”`)} />
                  <button type="button" onClick={() => onSelect(n.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    {n.kind === "project" ? <FlaskConical className="size-4 shrink-0 text-warm" /> : <BookOpen className="size-4 shrink-0 text-muted" />}
                    <span className={cn("truncate text-[14px] text-ink", n.status === "done" && "text-muted line-through decoration-faint")}>{n.title}</span>
                    {n.custom && <span className="rounded bg-sunken px-1.5 text-[10px] text-muted">yours</span>}
                  </button>
                  <span className="num text-xs text-muted">{n.weeks}w</span>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(n, -1)} className="rounded p-1 text-faint hover:bg-sunken hover:text-ink disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                    <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(n, 1)} className="rounded p-1 text-faint hover:bg-sunken hover:text-ink disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
                    <Select aria-label="Move to phase" value={n.phaseId} onChange={(e) => mutate((g) => { g.nodes.find((x) => x.id === n.id)!.phaseId = e.target.value; }, `Moved “${n.title}”`)} className="h-7 w-24 px-2 pr-6 text-xs">
                      {graph.phases.map((p, k) => <option key={p.id} value={p.id}>Phase {k + 1}</option>)}
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3">
              {adding === phase.id ? (
                <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); add(phase.id); }}>
                  <Input autoFocus placeholder="e.g. Kaggle: Titanic competition" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-9 min-w-48 flex-1 text-sm" />
                  <Select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as "course" | "project" })} className="h-9 w-28 text-sm"><option value="course">Course</option><option value="project">Project</option></Select>
                  <Input type="number" min={0.5} max={12} step={0.5} value={draft.weeks} onChange={(e) => setDraft({ ...draft, weeks: Number(e.target.value) })} className="h-9 w-20 text-sm" aria-label="Weeks" />
                  <Button size="sm" type="submit">Add</Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setAdding(null)}>Cancel</Button>
                </form>
              ) : (
                <button type="button" onClick={() => setAdding(phase.id)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-accent"><Plus className="size-3.5" /> Add a course or project</button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return <Button variant="ghost" size="sm" onClick={onRemove} className="text-danger hover:bg-danger-soft hover:text-danger"><Trash2 /> Remove</Button>;
}
