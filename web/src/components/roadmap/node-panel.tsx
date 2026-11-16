"use client";

import { ArrowUpRight, Target, X } from "lucide-react";
import { Badge, Input, Segmented, Textarea } from "@/components/ui/primitives";
import { Meter } from "@/components/ui/charts";
import type { NodeStatus, RoadmapGraph, RoadmapNode } from "@/lib/types";
import { RemoveButton } from "./timeline";

export function NodePanel({ graph, node, onUpdate, onRemove, onClose, readOnly }: {
  graph: RoadmapGraph; node: RoadmapNode; onUpdate: (patch: Partial<RoadmapNode>, note: string) => void; onRemove: () => void; onClose: () => void; readOnly?: boolean;
}) {
  const builders = graph.edges.filter((e) => e.to === node.id).map((e) => graph.nodes.find((n) => n.id === e.from)).filter(Boolean) as RoadmapNode[];
  const builds = graph.edges.filter((e) => e.from === node.id).map((e) => graph.nodes.find((n) => n.id === e.to)).filter((n) => n && n.kind === "skill") as RoadmapNode[];
  const gap = node.kind === "skill" ? graph.gaps.find((g) => node.skillIds?.includes(g.id)) : undefined;
  const isWork = node.kind === "course" || node.kind === "project";

  return (
    <aside className="card sticky top-6 p-5 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <Badge tone={node.kind === "skill" ? "accent" : node.kind === "project" ? "warm" : node.kind === "career" ? "success" : "neutral"}>
          {node.kind === "career" ? "Destination" : node.kind}
        </Badge>
        <button onClick={onClose} aria-label="Close details" className="rounded p-1 text-faint hover:bg-sunken hover:text-ink"><X className="size-4" /></button>
      </div>

      {isWork && !readOnly ? (
        <Input key={node.id} defaultValue={node.title} onBlur={(e) => e.target.value.trim() && e.target.value !== node.title && onUpdate({ title: e.target.value.trim() }, "Renamed a step")} className="mt-3 h-auto border-transparent px-0 text-[18px] font-semibold focus:border-line-strong focus:px-2" />
      ) : (
        <h3 className="mt-3 text-[18px] font-semibold leading-snug text-ink">{node.title}</h3>
      )}

      {node.description && <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{node.description}</p>}
      {node.why && <p className="mt-3 rounded-[10px] bg-accent-soft/60 px-3 py-2.5 text-[13px] leading-relaxed text-ink-2"><span className="font-medium text-accent">Why: </span>{node.why}</p>}
      {node.deliverable && <p className="mt-3 text-[13px] text-ink-2"><span className="font-medium text-ink">Deliverable: </span>{node.deliverable}</p>}

      {isWork && (
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Status</p>
            <Segmented<NodeStatus> size="sm" value={node.status} onChange={(status) => !readOnly && onUpdate({ status }, status === "done" ? `Completed “${node.title}”` : `Updated “${node.title}”`)}
              options={[{ value: "todo", label: "To do" }, { value: "doing", label: "In progress" }, { value: "done", label: "Done" }]} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Duration</span>
            {readOnly ? <span className="num text-sm">{node.weeks} weeks</span> : (
              <span className="flex items-center gap-2">
                <button className="size-7 rounded-md border border-line text-ink-2 hover:bg-sunken" onClick={() => onUpdate({ weeks: Math.max(0.5, node.weeks - 0.5) }, "Changed duration")} aria-label="Fewer weeks">−</button>
                <span className="num w-16 text-center text-sm">{node.weeks} wk</span>
                <button className="size-7 rounded-md border border-line text-ink-2 hover:bg-sunken" onClick={() => onUpdate({ weeks: Math.min(12, node.weeks + 0.5) }, "Changed duration")} aria-label="More weeks">+</button>
              </span>
            )}
          </div>
          {!readOnly && (
            <Textarea key={`notes-${node.id}`} defaultValue={node.description} placeholder="Notes" className="min-h-16 text-sm" onBlur={(e) => e.target.value !== node.description && onUpdate({ description: e.target.value }, "Edited notes")} />
          )}
        </div>
      )}

      {node.links?.length ? (
        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-2 text-xs font-medium text-muted">Find this course</p>
          <div className="flex flex-wrap gap-2">
            {node.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-2 hover:border-accent hover:text-accent">
                {l.provider} <ArrowUpRight className="size-3" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {builds.length > 0 && (
        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-2 text-xs font-medium text-muted">Builds</p>
          <div className="flex flex-wrap gap-1.5">{builds.map((s) => <Badge key={s.id} tone="accent">{s.title}</Badge>)}</div>
        </div>
      )}

      {node.kind === "skill" && (
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          {gap && (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><Target className="size-3.5" /> O*NET requirement</p>
              <Meter label="You now" value={gap.current * 100} tone="warm" />
              <Meter label="Role needs" value={gap.required * 100} />
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Built by</p>
            <ul className="space-y-1">{builders.map((b) => <li key={b.id} className="text-[13px] text-ink-2">· {b.title}</li>)}</ul>
          </div>
        </div>
      )}

      {isWork && !readOnly && <div className="mt-5 border-t border-line pt-4"><RemoveButton onRemove={onRemove} /></div>}
    </aside>
  );
}
