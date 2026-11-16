"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Briefcase, Check, FlaskConical, Sparkles } from "lucide-react";
import type { RoadmapGraph, RoadmapNode } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Courses → Skills → Career map. Nodes are laid out in three lanes; connectors are
 * measured from the DOM and drawn as curves. Hovering a node highlights its path.
 */
const ICON = { course: BookOpen, project: FlaskConical, skill: Sparkles, career: Briefcase, milestone: Check };

function NodeCard({ node, active, dim, onSelect, onHover, refFn }: {
  node: RoadmapNode; active: boolean; dim: boolean; onSelect: () => void; onHover: (id: string | null) => void; refFn: (el: HTMLButtonElement | null) => void;
}) {
  const Icon = ICON[node.kind];
  const done = node.status === "done";
  return (
    <button
      ref={refFn}
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      className={cn(
        "group relative w-full rounded-[11px] border bg-surface px-3 py-2.5 text-left transition-all duration-200",
        active ? "border-accent shadow-float ring-1 ring-accent" : "border-line hover:border-line-strong hover:shadow-card",
        dim && "opacity-35",
        node.kind === "career" && "border-ink bg-ink text-canvas dark:border-accent dark:bg-accent dark:text-accent-ink",
      )}
    >
      <span className="flex items-start gap-2.5">
        <span className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md [&_svg]:size-3.5",
          node.kind === "career" ? "bg-canvas/15" : done ? "bg-success-soft text-success" : node.kind === "skill" ? "bg-accent-soft text-accent" : node.kind === "project" ? "bg-warm-soft text-warm" : "bg-sunken text-ink-2",
        )}>
          {done && node.kind !== "career" ? <Check /> : <Icon />}
        </span>
        <span className="min-w-0">
          <span className={cn("block text-[13px] font-medium leading-snug", node.kind !== "career" && "text-ink", done && "line-through decoration-faint")}>{node.title}</span>
          {node.kind !== "skill" && node.kind !== "career" && (
            <span className="mt-0.5 block text-[11px] text-muted">{node.kind === "project" ? "Project" : "Course"} · {node.weeks}w{node.status === "doing" ? " · in progress" : ""}</span>
          )}
          {node.kind === "career" && <span className="mt-0.5 block text-[11px] opacity-70">Destination</span>}
        </span>
      </span>
    </button>
  );
}

export function GraphView({ graph, selected, onSelect }: { graph: RoadmapGraph; selected: string | null; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [paths, setPaths] = useState<{ key: string; from: string; to: string; d: string }[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  const phases = graph.phases;
  const work = graph.nodes.filter((n) => n.kind === "course" || n.kind === "project");
  const skills = graph.nodes.filter((n) => n.kind === "skill");
  const careerNode = graph.nodes.find((n) => n.kind === "career");

  // Connected set for highlighting (walk edges both ways).
  const focus = hover ?? selected;
  const connected = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    const forward = (id: string) => graph.edges.filter((e) => e.from === id).forEach((e) => { if (!set.has(e.to)) { set.add(e.to); forward(e.to); } });
    const backward = (id: string) => graph.edges.filter((e) => e.to === id).forEach((e) => { if (!set.has(e.from)) { set.add(e.from); backward(e.from); } });
    forward(focus);
    if (graph.nodes.find((n) => n.id === focus)?.kind !== "career") backward(focus);
    else graph.edges.filter((e) => e.to === focus).forEach((e) => set.add(e.from));
    return set;
  }, [focus, graph]);

  const measure = useCallback(() => {
    const root = container.current?.getBoundingClientRect();
    if (!root) return;
    const next = graph.edges.flatMap((e, i) => {
      const a = refs.current.get(e.from)?.getBoundingClientRect();
      const b = refs.current.get(e.to)?.getBoundingClientRect();
      if (!a || !b) return [];
      const x1 = a.right - root.left, y1 = a.top + a.height / 2 - root.top;
      const x2 = b.left - root.left, y2 = b.top + b.height / 2 - root.top;
      const mid = (x1 + x2) / 2;
      return [{ key: `${e.from}-${e.to}-${i}`, from: e.from, to: e.to, d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}` }];
    });
    setPaths(next);
  }, [graph]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (container.current) observer.observe(container.current);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  const bind = (id: string) => (el: HTMLButtonElement | null) => { if (el) refs.current.set(id, el); else refs.current.delete(id); };
  const dim = (id: string) => !!connected && !connected.has(id);

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div ref={container} className="relative grid min-w-[760px] grid-cols-[minmax(240px,1.15fr)_minmax(200px,1fr)_minmax(170px,0.8fr)] gap-x-16 py-2">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {paths.map((p) => {
            const lit = connected ? connected.has(p.from) && connected.has(p.to) : false;
            return <path key={p.key} d={p.d} fill="none" stroke={lit ? "var(--accent)" : "var(--line-strong)"} strokeWidth={lit ? 1.6 : 1} strokeOpacity={connected && !lit ? 0.25 : 1} className="transition-[stroke,stroke-opacity] duration-200" />;
          })}
        </svg>

        <div className="space-y-5">
          <p className="eyebrow">Courses &amp; projects</p>
          {phases.map((phase) => {
            const items = work.filter((n) => n.phaseId === phase.id);
            if (!items.length) return null;
            return (
              <div key={phase.id} className="space-y-2">
                <p className="text-[11px] font-medium text-faint"><span className="num">W{phase.startWeek}–{phase.startWeek + phase.weeks - 1}</span> · {phase.title}</p>
                {items.map((n) => <NodeCard key={n.id} node={n} active={selected === n.id} dim={dim(n.id)} onSelect={() => onSelect(n.id)} onHover={setHover} refFn={bind(n.id)} />)}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col">
          <p className="eyebrow mb-5">Skills</p>
          <div className="flex flex-1 flex-col justify-center gap-2">
            {skills.map((n) => <NodeCard key={n.id} node={n} active={selected === n.id} dim={dim(n.id)} onSelect={() => onSelect(n.id)} onHover={setHover} refFn={bind(n.id)} />)}
          </div>
        </div>

        <div className="flex flex-col">
          <p className="eyebrow mb-5">Career</p>
          <div className="flex flex-1 items-center">
            {careerNode && <NodeCard node={careerNode} active={selected === careerNode.id} dim={dim(careerNode.id)} onSelect={() => onSelect(careerNode.id)} onHover={setHover} refFn={bind(careerNode.id)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
