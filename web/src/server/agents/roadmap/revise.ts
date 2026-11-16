import "server-only";
import { z } from "zod";
import { completeJSON } from "@/server/ai/groq";
import { courseSearchLinks, uid } from "@/lib/utils";
import { layoutPhases } from "./pipeline";
import type { RoadmapGraph, RoadmapNode } from "@/lib/types";

/**
 * Roadmap Reviser agent. Turns a plain-language request ("I already know Python",
 * "make it 3 months", "add more system design") into validated edit operations.
 * mode "suggest" returns proposals the student can apply one by one.
 */

const opSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("add"),
    kind: z.enum(["course", "project"]),
    title: z.string().min(3),
    description: z.string().catch(""),
    phaseId: z.string(),
    weeks: z.coerce.number().min(0.5).max(12).catch(2),
    searchQuery: z.string().catch(""),
    builds: z.array(z.string()).catch([]),
  }),
  z.object({ op: z.literal("remove"), id: z.string() }),
  z.object({ op: z.literal("update"), id: z.string(), title: z.string().optional(), description: z.string().optional(), weeks: z.coerce.number().min(0.5).max(12).optional() }),
  z.object({ op: z.literal("move"), id: z.string(), phaseId: z.string() }),
  z.object({ op: z.literal("set_hours"), hoursPerWeek: z.coerce.number().min(2).max(60) }),
  z.object({ op: z.literal("scale_weeks"), factor: z.coerce.number().min(0.3).max(3) }),
]);
export type RoadmapOp = z.infer<typeof opSchema>;

const applySchema = z.object({ message: z.string(), operations: z.array(opSchema).max(12) });
const suggestSchema = z.object({
  suggestions: z.array(z.object({ title: z.string(), reason: z.string(), operations: z.array(opSchema).min(1).max(6) })).min(1).max(4),
});

function describeGraph(g: RoadmapGraph) {
  const phases = g.phases.map((p) => {
    const items = g.nodes.filter((n) => n.phaseId === p.id && (n.kind === "course" || n.kind === "project"))
      .map((n) => `   - ${n.id} [${n.kind}${n.status === "done" ? ", done" : ""}] ${n.title} (${n.weeks}w; builds ${n.skillIds?.join(",") || "-"})`).join("\n");
    return `${p.id}: ${p.title} — ${p.goal}\n${items}`;
  }).join("\n");
  const skills = g.nodes.filter((n) => n.kind === "skill").map((n) => `${n.skillIds?.[0]}=${n.title}`).join("; ");
  return `HOURS/WEEK: ${g.hoursPerWeek} · TOTAL: ${g.totalWeeks} weeks\nSKILLS: ${skills}\nPHASES:\n${phases}`;
}

const RULES = `Operations you may use (JSON):
{"op":"add","kind":"course|project","title":"","description":"","phaseId":"ph1","weeks":2,"searchQuery":"","builds":["skill id"]}
{"op":"remove","id":"c3"}  {"op":"update","id":"c2","title":"","description":"","weeks":3}
{"op":"move","id":"c4","phaseId":"ph2"}  {"op":"set_hours","hoursPerWeek":15}  {"op":"scale_weeks","factor":0.6}
Use only ids and phase ids that exist. Never remove items marked done. Never invent URLs.`;

export async function reviseRoadmap(graph: RoadmapGraph, instruction: string, target: string) {
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `You edit a student's career roadmap toward "${target}". Apply the student's request with the smallest set of operations.
${RULES}
Return {"message":"one or two sentences telling the student what changed and why","operations":[...]}.`,
    prompt: `ROADMAP\n${describeGraph(graph)}\n\nSTUDENT REQUEST: ${instruction}`,
    schema: applySchema,
    maxTokens: 1500,
    temperature: 0.3,
  });
  return { message: data.message, graph: applyOps(graph, data.operations), operations: data.operations, model: meta.model };
}

export async function suggestImprovements(graph: RoadmapGraph, target: string, context: string) {
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `You review a student's career roadmap toward "${target}" and propose 3 specific improvements (e.g. a missing fundamental,
a better project, rebalancing an overloaded phase, using practice results). Each suggestion has a short title, a reason grounded in the
roadmap or the student's progress, and the operations that implement it.
${RULES}
Return {"suggestions":[{"title":"","reason":"","operations":[...]}]}.`,
    prompt: `ROADMAP\n${describeGraph(graph)}\n\nSTUDENT PROGRESS\n${context}`,
    schema: suggestSchema,
    maxTokens: 1800,
    temperature: 0.5,
  });
  return { suggestions: data.suggestions, model: meta.model };
}

/** Apply edit operations safely; invalid ids are ignored. */
export function applyOps(source: RoadmapGraph, ops: RoadmapOp[]): RoadmapGraph {
  const graph: RoadmapGraph = structuredClone(source);
  const phaseIds = new Set(graph.phases.map((p) => p.id));
  const skillByGap = new Map(graph.nodes.filter((n) => n.kind === "skill").map((n) => [n.skillIds?.[0] ?? "", n.id]));
  for (const op of ops) {
    if (op.op === "add" && phaseIds.has(op.phaseId)) {
      const node: RoadmapNode = {
        id: `${op.kind[0]}-${uid()}`, kind: op.kind, title: op.title, description: op.description, phaseId: op.phaseId,
        weeks: op.weeks, status: "todo", skillIds: op.builds, links: op.kind === "course" ? courseSearchLinks(op.searchQuery || op.title) : undefined,
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
      if (op.weeks) node.weeks = op.weeks;
    } else if (op.op === "move") {
      const node = graph.nodes.find((n) => n.id === op.id);
      if (node && phaseIds.has(op.phaseId)) node.phaseId = op.phaseId;
    } else if (op.op === "set_hours") {
      const ratio = graph.hoursPerWeek / op.hoursPerWeek;
      graph.hoursPerWeek = op.hoursPerWeek;
      graph.nodes.forEach((n) => { if (n.kind === "course" || n.kind === "project") n.weeks = round(n.weeks * ratio); });
    } else if (op.op === "scale_weeks") {
      graph.nodes.forEach((n) => { if ((n.kind === "course" || n.kind === "project") && n.status !== "done") n.weeks = round(n.weeks * op.factor); });
    }
  }
  layoutPhases(graph);
  return graph;
}

const round = (n: number) => Math.max(0.5, Math.round(n * 2) / 2);
