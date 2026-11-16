import "server-only";
import { z } from "zod";
import { completeJSON, type CallMeta } from "@/server/ai/groq";
import { TTL } from "@/server/ai/cache";
import { analyseProfile, describeProfile, targetJobZone } from "@/server/agents/profile-analyst";
import { matchCareers, similarityTo } from "@/server/ml/matcher";
import { career, careerBrief, searchCareers } from "@/server/onet/catalogue";
import { analyseGaps, coverage, missingTechnologies } from "./gaps";
import { courseSearchLinks, uid } from "@/lib/utils";
import { layoutPhases } from "@/lib/roadmap-ops";
import type { CareerMatch, Profile, RoadmapEdge, RoadmapGraph, RoadmapNode, RoadmapPhase, SkillGap, TraceStep } from "@/lib/types";

/**
 * Roadmap agent — a 7-step pipeline that turns a student profile into a
 * courses → skills → career roadmap. Each step reports progress through `emit`
 * so the UI can show the agent working, and the full trace is saved with the roadmap.
 */

export interface PipelineInput {
  profile: Partial<Profile>;
  targetCode?: string;
  targetQuery?: string;
  hoursPerWeek: number;
  timelineMonths: number;
  focus?: string;
  reuseAnalysis?: boolean;
}

export type PipelineEvent = { type: "step"; step: TraceStep } | { type: "result"; result: PipelineResult };

export interface PipelineResult {
  title: string;
  target: { code: string; title: string; family: string };
  graph: RoadmapGraph;
  trace: TraceStep[];
  vector: Record<string, number>;
  analysis: Profile["analysis"];
  matches: CareerMatch[];
}

const plannerSchema = z.object({
  courses: z.array(z.object({
    id: z.string(),
    title: z.string().min(3),
    type: z.enum(["academic", "online", "practice"]).catch("online"),
    description: z.string().catch(""),
    searchQuery: z.string().catch(""),
    weeks: z.coerce.number().min(0.5).max(12).catch(2),
    builds: z.array(z.string()).catch([]),
    prerequisites: z.array(z.string()).catch([]),
    why: z.string().catch(""),
  })).min(3).max(14),
  skills: z.array(z.object({ id: z.string(), name: z.string(), why: z.string().catch("") })).min(3).max(14),
  projects: z.array(z.object({
    id: z.string(), title: z.string(), description: z.string().catch(""), builds: z.array(z.string()).catch([]),
    weeks: z.coerce.number().min(0.5).max(8).catch(2), deliverable: z.string().catch(""),
  })).min(1).max(5),
});

const composerSchema = z.object({
  summary: z.string().min(20),
  phases: z.array(z.object({
    title: z.string(), goal: z.string(), milestone: z.string(), items: z.array(z.string()).min(1),
  })).min(2).max(6),
});

const fixSchema = z.object({
  courses: z.array(plannerSchema.shape.courses.element).max(4),
});

export async function runPipeline(input: PipelineInput, emit: (e: PipelineEvent) => void): Promise<PipelineResult> {
  const trace: TraceStep[] = [];
  const start = (id: string, agent: string, title: string) => {
    const step: TraceStep = { id, agent, title, status: "running" };
    trace.push(step);
    emit({ type: "step", step: { ...step } });
    const t0 = Date.now();
    return (patch: Partial<TraceStep>, meta?: CallMeta) => {
      Object.assign(step, { status: "done", ms: Date.now() - t0, ...(meta ? { model: meta.model, cached: meta.cached, tokens: meta.tokens } : {}), ...patch });
      emit({ type: "step", step: { ...step } });
    };
  };

  const profile = input.profile;

  // 1 ─ Profile Analyst (LLM) ───────────────────────────────────
  let done = start("analyst", "Profile Analyst", "Map the student onto O*NET descriptors");
  let vector = profile.onet_vector ?? null;
  let analysis = profile.analysis ?? null;
  if (input.reuseAnalysis && vector && analysis) {
    done({ status: "skipped", summary: "Reused your latest profile analysis (no changes since).", detail: { strengths: analysis.strengths } });
  } else {
    const result = await analyseProfile(profile);
    vector = result.vector;
    analysis = result.analysis;
    done({ summary: result.analysis.summary, detail: { strengths: result.analysis.strengths, growthAreas: result.analysis.growthAreas, descriptorsRated: Object.keys(vector).length } }, result.meta);
  }

  // 2 ─ Career Matcher (ML) ─────────────────────────────────────
  done = start("matcher", "Career Matcher", "Score 910 O*NET occupations (trained model)");
  const zone = Math.ceil(targetJobZone(profile));
  const { matches, families } = matchCareers(vector!, { limit: 8, maxJobZone: zone });
  done({
    summary: `Top match: ${matches[0].title} (${matches[0].match}%). Strongest family: ${families[0].name} (${Math.round(families[0].probability * 100)}%).`,
    detail: { matches: matches.map((m) => ({ title: m.title, match: m.match, family: m.family })), families: families.slice(0, 4).map((f) => ({ name: f.name, p: Math.round(f.probability * 100) })) },
    model: "logreg + cosine (local)",
  });

  // 3 ─ Target selection ────────────────────────────────────────
  done = start("target", "Navigator", "Choose the destination career");
  let code = input.targetCode && career(input.targetCode) ? input.targetCode : undefined;
  let reason = "you picked it";
  if (!code && input.targetQuery) {
    // Among the closest O*NET titles, prefer the one this student is most similar to.
    const candidates = searchCareers(input.targetQuery, 5);
    const best = candidates[0]?.score ?? 0;
    const close = candidates.filter((c) => c.score >= best * 0.85);
    const ranked = close.map((c) => ({ ...c, sim: similarityTo(vector!, c.code) ?? 0 })).sort((a, b) => b.sim - a.sim);
    code = ranked[0]?.code;
    reason = ranked.length > 1
      ? `best fit for “${input.targetQuery}” among ${ranked.map((r) => r.title).join(", ")} (your similarity ${ranked[0].sim}%)`
      : `closest O*NET occupation to “${input.targetQuery}”`;
  }
  if (!code) {
    const wanted = profile.goals?.targetRoles?.[0];
    const fromGoal = wanted ? searchCareers(wanted, 1)[0]?.code : undefined;
    code = fromGoal ?? matches[0].code;
    reason = fromGoal ? `matches your stated goal “${wanted}”` : "your highest-scoring career match";
  }
  const target = career(code)!;
  done({ summary: `${target.title} — ${reason}.`, detail: { code, family: target.family, jobZone: target.jobZone } });

  // 4 ─ Gap Analyzer (O*NET) ────────────────────────────────────
  done = start("gaps", "Gap Analyzer", "Compare your level with O*NET requirements");
  const { gaps } = analyseGaps(code, vector!);
  const topGaps = gaps.filter((g) => g.gap > 0.02).slice(0, 6);
  const tech = missingTechnologies(code, profile);
  const covered = coverage(gaps);
  done({
    summary: `You already meet ${covered}% of the weighted requirements. Biggest gaps: ${topGaps.slice(0, 3).map((g) => g.name).join(", ") || "none"}.`,
    detail: { coverage: covered, gaps: topGaps.map((g) => ({ name: g.name, current: g.current, required: g.required })), technologies: tech },
  });

  // 5 ─ Curriculum Planner (LLM) ────────────────────────────────
  done = start("planner", "Curriculum Planner", "Pick courses and projects that close the gaps");
  const weeksAvailable = Math.round(input.timelineMonths * 4.3);
  const gapLines = topGaps.map((g) => `- ${g.id} | ${g.name} | current ${pct(g.current)} → needs ${pct(g.required)}`).join("\n");
  const plannerPrompt = `STUDENT\n${describeProfile(profile)}\n\nTARGET CAREER\n${careerBrief(code)}\n\nSKILL GAPS (id | name | level)\n${gapLines || "- none significant; focus on depth"}\nMISSING TECHNOLOGIES: ${tech.join(", ") || "none"}\n\nTIME: ${input.hoursPerWeek} hours/week for ${weeksAvailable} weeks.${input.focus ? `\nSTUDENT'S REQUEST: ${input.focus}` : ""}`;
  const planner = await completeJSON({
    tier: "reasoning",
    system: `You are a curriculum planner for Indian engineering students. Design the learning path from courses to skills to a career.
Return JSON {"courses":[...],"skills":[...],"projects":[...]}.
- skills: 5-9 concrete skills the student must build for the target career. Use the given gap ids (e.g. "kn:2.C.3.a") as ids where a skill closes that gap; otherwise ids like "s1". Include missing technologies as skills.
- courses: 5-10 items in learning order. type: "academic" (university subject, e.g. "Operating Systems"), "online" (MOOC topic), or "practice" (e.g. LeetCode-style DSA practice).
  Each: id ("c1".."c10"), title (specific, e.g. "Deep Learning with PyTorch"), description (1 sentence), searchQuery (what to search on NPTEL/Coursera/YouTube),
  weeks (realistic at the student's hours), builds (skill ids it develops), prerequisites (earlier course ids), why (1 short sentence tied to the student).
- projects: 2-3 portfolio projects (id "p1"...), each builds skills and has a concrete deliverable.
- Do not repeat what the student already knows well. Never invent URLs. Total course+project weeks should fit the time available.`,
    prompt: plannerPrompt,
    schema: plannerSchema,
    maxTokens: 3200,
    temperature: 0.4,
    cache: { namespace: "planner", key: [plannerPrompt], ttl: TTL.day },
  });
  const plan = planner.data;
  done({ summary: `${plan.courses.length} courses, ${plan.skills.length} skills and ${plan.projects.length} projects selected.`, detail: { courses: plan.courses.map((c) => c.title), projects: plan.projects.map((p) => p.title) } }, planner.meta);

  // 6 ─ Roadmap Composer (LLM) ──────────────────────────────────
  done = start("composer", "Roadmap Composer", "Sequence everything into phases and milestones");
  const itemList = [...plan.courses.map((c) => `${c.id}: ${c.title} (${c.weeks}w, after ${c.prerequisites.join("/") || "none"})`), ...plan.projects.map((p) => `${p.id}: PROJECT ${p.title} (${p.weeks}w)`)].join("\n");
  const composer = await completeJSON({
    tier: "reasoning",
    system: `You sequence a learning plan into phases. Return JSON {"summary":"2-3 sentence overview addressed to the student","phases":[{"title":"","goal":"","milestone":"a checkable outcome","items":["c1","p1"]}]}.
Use 3-5 phases. Respect prerequisites. Put each project after the courses it depends on. Every item id must appear exactly once.`,
    prompt: `TARGET: ${target.title}\nWEEKS AVAILABLE: ${weeksAvailable}\nITEMS:\n${itemList}`,
    schema: composerSchema,
    maxTokens: 1400,
    temperature: 0.3,
    cache: { namespace: "composer", key: [itemList, target.title, weeksAvailable], ttl: TTL.day },
  });
  const graph = buildGraph({ plan, phasesIn: composer.data.phases, summary: composer.data.summary, gaps: topGaps, code, hoursPerWeek: input.hoursPerWeek, weeksAvailable });
  done({ summary: `${graph.phases.length} phases over ${graph.totalWeeks} weeks.`, detail: { phases: graph.phases.map((p) => `${p.title} (weeks ${p.startWeek}–${p.startWeek + p.weeks - 1})`) } }, composer.meta);

  // 7 ─ Critic (rules + LLM repair) ─────────────────────────────
  done = start("critic", "Critic", "Check coverage and feasibility, repair if needed");
  let checks = critique(graph, topGaps, weeksAvailable);
  let repaired = 0;
  const uncovered = topGaps.filter((g) => !graph.nodes.some((n) => n.kind !== "career" && n.skillIds?.includes(g.id)));
  let repairMeta: CallMeta | undefined;
  if (uncovered.length) {
    const fix = await completeJSON({
      tier: "fast",
      system: `Add 1-3 courses that close the listed skill gaps. Return JSON {"courses":[{"id":"x1","title":"","type":"online","description":"","searchQuery":"","weeks":2,"builds":["<gap id>"],"prerequisites":[],"why":""}]}`,
      prompt: `TARGET: ${target.title}\nUNCOVERED GAPS:\n${uncovered.map((g) => `- ${g.id} | ${g.name}`).join("\n")}`,
      schema: fixSchema,
      maxTokens: 800,
      temperature: 0.3,
    }).catch(() => null);
    if (fix) {
      repairMeta = fix.meta;
      const lastPhase = graph.phases[graph.phases.length - 1];
      for (const c of fix.data.courses) {
        const node = courseNode({ ...c, id: `fix-${uid()}` }, lastPhase.id);
        graph.nodes.push(node);
        for (const s of c.builds) ensureSkillEdge(graph, node.id, s, uncovered);
        repaired++;
      }
      layoutPhases(graph, weeksAvailable);
      checks = critique(graph, topGaps, weeksAvailable);
    }
  }
  graph.checks = checks;
  done({
    summary: `${checks.filter((c) => c.passed).length}/${checks.length} checks passed${repaired ? ` after adding ${repaired} course${repaired > 1 ? "s" : ""}` : ""}.`,
    detail: { checks },
  }, repairMeta);

  const result: PipelineResult = {
    title: `Path to ${target.title}`,
    target: { code, title: target.title, family: target.family },
    graph,
    trace,
    vector: vector!,
    analysis,
    matches,
  };
  emit({ type: "result", result });
  return result;
}

// ── graph construction ─────────────────────────────────────────
type Plan = z.infer<typeof plannerSchema>;

function courseNode(c: Plan["courses"][number], phaseId: string): RoadmapNode {
  const query = c.searchQuery || c.title;
  return {
    id: c.id, kind: "course", title: c.title, description: c.description, phaseId, weeks: c.weeks, status: "todo",
    skillIds: c.builds, links: courseSearchLinks(query), why: c.why,
  };
}

function ensureSkillEdge(graph: RoadmapGraph, from: string, skillId: string, gaps: SkillGap[]) {
  let skill = graph.nodes.find((n) => n.kind === "skill" && n.id === `skill:${skillId}`);
  if (!skill) {
    const gap = gaps.find((g) => g.id === skillId);
    if (!gap) return;
    skill = { id: `skill:${skillId}`, kind: "skill", title: gap.name, description: "", phaseId: graph.phases.at(-1)!.id, weeks: 0, status: "todo", skillIds: [skillId] };
    graph.nodes.push(skill);
    graph.edges.push({ from: skill.id, to: graph.nodes.find((n) => n.kind === "career")!.id });
  }
  graph.edges.push({ from, to: skill.id });
}

function buildGraph({ plan, phasesIn, summary, gaps, code, hoursPerWeek, weeksAvailable }: {
  plan: Plan; phasesIn: z.infer<typeof composerSchema>["phases"]; summary: string; gaps: SkillGap[]; code: string; hoursPerWeek: number; weeksAvailable: number;
}): RoadmapGraph {
  const info = career(code)!;
  const phases: RoadmapPhase[] = phasesIn.map((p, i) => ({ id: `ph${i + 1}`, title: p.title, goal: p.goal, milestone: p.milestone, startWeek: 1, weeks: 1 }));
  const phaseOf = new Map<string, string>();
  phasesIn.forEach((p, i) => p.items.forEach((item) => { if (!phaseOf.has(item)) phaseOf.set(item, phases[i].id); }));
  const last = phases[phases.length - 1].id;

  const nodes: RoadmapNode[] = [];
  const edges: RoadmapEdge[] = [];
  const careerNode: RoadmapNode = { id: "career", kind: "career", title: info.title, description: info.description, phaseId: last, weeks: 0, status: "todo" };

  const skillIds = new Set(plan.skills.map((s) => s.id));
  for (const s of plan.skills) {
    const gap = gaps.find((g) => g.id === s.id);
    nodes.push({ id: `skill:${s.id}`, kind: "skill", title: s.name, description: s.why, phaseId: last, weeks: 0, status: "todo", skillIds: [s.id], why: gap ? `O*NET gap: you're at ${pct(gap.current)}, the role needs ${pct(gap.required)}.` : s.why });
    edges.push({ from: `skill:${s.id}`, to: careerNode.id });
  }
  for (const c of plan.courses) {
    nodes.push(courseNode(c, phaseOf.get(c.id) ?? last));
    for (const b of c.builds) if (skillIds.has(b)) edges.push({ from: c.id, to: `skill:${b}` });
  }
  for (const p of plan.projects) {
    nodes.push({ id: p.id, kind: "project", title: p.title, description: p.description, phaseId: phaseOf.get(p.id) ?? last, weeks: p.weeks, status: "todo", skillIds: p.builds, deliverable: p.deliverable });
    for (const b of p.builds) if (skillIds.has(b)) edges.push({ from: p.id, to: `skill:${b}` });
  }
  // A skill's phase is the phase of the first item that builds it.
  for (const skill of nodes.filter((n) => n.kind === "skill")) {
    const builders = edges.filter((e) => e.to === skill.id).map((e) => nodes.find((n) => n.id === e.from)?.phaseId).filter(Boolean) as string[];
    if (builders.length) skill.phaseId = builders.sort()[0];
  }
  nodes.push(careerNode);

  // Drop skills nothing builds (keeps the graph honest and readable).
  const built = new Set(edges.filter((e) => e.to.startsWith("skill:")).map((e) => e.to));
  const orphan = new Set(nodes.filter((n) => n.kind === "skill" && !built.has(n.id)).map((n) => n.id));
  const keptNodes = nodes.filter((n) => !orphan.has(n.id));
  const keptEdges = edges.filter((e) => !orphan.has(e.from) && !orphan.has(e.to));

  const graph: RoadmapGraph = { summary, totalWeeks: 0, hoursPerWeek, phases, nodes: keptNodes, edges: keptEdges, gaps, checks: [] };
  layoutPhases(graph, weeksAvailable);
  return graph;
}

export function critique(graph: RoadmapGraph, gaps: SkillGap[], weeksAvailable: number) {
  const builders = (id: string) => graph.nodes.filter((n) => (n.kind === "course" || n.kind === "project") && n.skillIds?.includes(id));
  const uncovered = gaps.filter((g) => builders(g.id).length === 0);
  const orphanSkills = graph.nodes.filter((n) => n.kind === "skill" && !graph.edges.some((e) => e.to === n.id));
  return [
    { label: "Every major O*NET gap is covered", passed: uncovered.length === 0, detail: uncovered.length ? `Not covered: ${uncovered.map((g) => g.name).join(", ")}` : `${gaps.length} gaps covered` },
    { label: "Fits the timeline", passed: graph.totalWeeks <= weeksAvailable + 1, detail: `${graph.totalWeeks} of ${weeksAvailable} weeks` },
    { label: "Includes portfolio projects", passed: graph.nodes.some((n) => n.kind === "project"), detail: `${graph.nodes.filter((n) => n.kind === "project").length} projects` },
    { label: "Every skill has a course or project", passed: orphanSkills.length === 0, detail: orphanSkills.length ? `${orphanSkills.length} skills without a builder` : "All linked" },
    { label: "Course links are real searches", passed: true, detail: "NPTEL, Coursera and YouTube search links — no invented URLs" },
  ];
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
