// Pure roadmap graph operations, shared by the server agents and the browser editor.
import type { NodeKind, RoadmapGraph, RoadmapNode } from "./types";
import { courseSearchLinks, uid } from "./utils";

export type RoadmapOp =
  | { op: "add"; kind: "course" | "project"; title: string; description: string; phaseId: string; weeks: number; searchQuery: string; builds: string[] }
  | { op: "remove"; id: string }
  | { op: "update"; id: string; title?: string; description?: string; weeks?: number }
  | { op: "move"; id: string; phaseId: string }
  | { op: "set_hours"; hoursPerWeek: number }
  | { op: "scale_weeks"; factor: number };

const WORK: NodeKind[] = ["course", "project"];
export const isWork = (n: RoadmapNode) => WORK.includes(n.kind);

/** Recompute phase start weeks and durations from their items (optionally scaled to fit a timeline). */
export function layoutPhases(graph: RoadmapGraph, weeksAvailable?: number) {
  const work = (phaseId: string) => graph.nodes.filter((n) => n.phaseId === phaseId && isWork(n)).reduce((s, n) => s + n.weeks, 0);
  const raw = graph.phases.map((p) => Math.max(1, work(p.id)));
  const total = raw.reduce((a, b) => a + b, 0);
  const scale = weeksAvailable && total > weeksAvailable ? weeksAvailable / total : 1;
  let week = 1;
  graph.phases.forEach((p, i) => {
    p.startWeek = week;
    p.weeks = Math.max(1, Math.round(raw[i] * scale));
    week += p.weeks;
  });
  graph.totalWeeks = week - 1;
  return graph;
}

const half = (n: number) => Math.max(0.5, Math.round(n * 2) / 2);

/** Apply edit operations safely; unknown ids are ignored and completed work is never removed. */
export function applyOps(source: RoadmapGraph, ops: RoadmapOp[]): RoadmapGraph {
  const graph: RoadmapGraph = structuredClone(source);
  const phaseIds = new Set(graph.phases.map((p) => p.id));
  const skillByGap = new Map(graph.nodes.filter((n) => n.kind === "skill").map((n) => [n.skillIds?.[0] ?? "", n.id]));
  for (const op of ops) {
    if (op.op === "add" && phaseIds.has(op.phaseId)) {
      const node: RoadmapNode = {
        id: `${op.kind[0]}-${uid()}`, kind: op.kind, title: op.title, description: op.description, phaseId: op.phaseId,
        weeks: half(op.weeks), status: "todo", skillIds: op.builds,
        links: op.kind === "course" ? courseSearchLinks(op.searchQuery || op.title) : undefined,
      };
      graph.nodes.push(node);
      for (const b of op.builds) { const s = skillByGap.get(b); if (s) graph.edges.push({ from: node.id, to: s }); }
    } else if (op.op === "remove") {
      const node = graph.nodes.find((n) => n.id === op.id);
      if (!node || node.kind === "career" || node.status === "done") continue;
      graph.nodes = graph.nodes.filter((n) => n.id !== op.id);
      graph.edges = graph.edges.filter((e) => e.from !== op.id && e.to !== op.id);
    } else if (op.op === "update") {
      const node = graph.nodes.find((n) => n.id === op.id);
      if (!node) continue;
      if (op.title) node.title = op.title;
      if (op.description) node.description = op.description;
      if (op.weeks) node.weeks = half(op.weeks);
    } else if (op.op === "move") {
      const node = graph.nodes.find((n) => n.id === op.id);
      if (node && phaseIds.has(op.phaseId)) node.phaseId = op.phaseId;
    } else if (op.op === "set_hours") {
      const ratio = graph.hoursPerWeek / op.hoursPerWeek;
      graph.hoursPerWeek = op.hoursPerWeek;
      graph.nodes.forEach((n) => { if (isWork(n) && n.status !== "done") n.weeks = half(n.weeks * ratio); });
    } else if (op.op === "scale_weeks") {
      graph.nodes.forEach((n) => { if (isWork(n) && n.status !== "done") n.weeks = half(n.weeks * op.factor); });
    }
  }
  return layoutPhases(graph);
}

/** Human summary of the difference between two graphs. */
export function diffGraphs(a: RoadmapGraph, b: RoadmapGraph) {
  const ids = (g: RoadmapGraph) => new Map(g.nodes.filter(isWork).map((n) => [n.id, n]));
  const A = ids(a), B = ids(b);
  const added = [...B.values()].filter((n) => !A.has(n.id));
  const removed = [...A.values()].filter((n) => !B.has(n.id));
  const changed = [...B.values()].filter((n) => {
    const o = A.get(n.id);
    return o && (o.title !== n.title || o.weeks !== n.weeks || o.phaseId !== n.phaseId || o.description !== n.description);
  });
  return { added, removed, changed, weeks: [a.totalWeeks, b.totalWeeks] as const };
}

export function roadmapProgress(graph: RoadmapGraph) {
  const work = graph.nodes.filter(isWork);
  const total = work.reduce((s, n) => s + n.weeks, 0);
  const done = work.filter((n) => n.status === "done").reduce((s, n) => s + n.weeks, 0);
  return { items: work.length, done: work.filter((n) => n.status === "done").length, percent: total ? Math.round((done / total) * 100) : 0 };
}
