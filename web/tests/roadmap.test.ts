import { test } from "node:test";
import assert from "node:assert/strict";
import { applyOps, diffGraphs, layoutPhases, roadmapProgress } from "../src/lib/roadmap-ops";
import { hollandCode, scoreRiasec } from "../src/lib/riasec";
import { courseSearchLinks } from "../src/lib/utils";
import type { RoadmapGraph } from "../src/lib/types";

function graph(): RoadmapGraph {
  return {
    summary: "test", totalWeeks: 0, hoursPerWeek: 10, gaps: [], checks: [],
    phases: [
      { id: "ph1", title: "Foundations", goal: "", milestone: "", startWeek: 1, weeks: 1 },
      { id: "ph2", title: "Depth", goal: "", milestone: "", startWeek: 1, weeks: 1 },
    ],
    nodes: [
      { id: "c1", kind: "course", title: "Python", description: "", phaseId: "ph1", weeks: 2, status: "done", skillIds: ["ts:prog"] },
      { id: "c2", kind: "course", title: "Statistics", description: "", phaseId: "ph1", weeks: 3, status: "todo", skillIds: ["kn:math"] },
      { id: "p1", kind: "project", title: "Capstone", description: "", phaseId: "ph2", weeks: 4, status: "todo", skillIds: ["ts:prog"] },
      { id: "skill:ts:prog", kind: "skill", title: "Programming", description: "", phaseId: "ph1", weeks: 0, status: "todo", skillIds: ["ts:prog"] },
      { id: "career", kind: "career", title: "Data Scientist", description: "", phaseId: "ph2", weeks: 0, status: "todo" },
    ],
    edges: [{ from: "c1", to: "skill:ts:prog" }, { from: "p1", to: "skill:ts:prog" }, { from: "skill:ts:prog", to: "career" }],
  };
}

test("layoutPhases makes phases contiguous and sized by their work", () => {
  const g = layoutPhases(graph());
  assert.deepEqual(g.phases.map((p) => [p.startWeek, p.weeks]), [[1, 5], [6, 4]]);
  assert.equal(g.totalWeeks, 9);
});

test("layoutPhases scales everything down to fit the timeline", () => {
  const g = layoutPhases(graph(), 6);
  assert.ok(g.totalWeeks <= 7, `expected ≤7 weeks, got ${g.totalWeeks}`);
});

test("applyOps never removes completed work or the career node", () => {
  const g = applyOps(graph(), [{ op: "remove", id: "c1" }, { op: "remove", id: "career" }, { op: "remove", id: "c2" }]);
  assert.ok(g.nodes.some((n) => n.id === "c1"), "done course kept");
  assert.ok(g.nodes.some((n) => n.id === "career"), "career kept");
  assert.ok(!g.nodes.some((n) => n.id === "c2"), "todo course removed");
  assert.ok(!g.edges.some((e) => e.from === "c2" || e.to === "c2"), "edges cleaned up");
});

test("applyOps adds courses with real search links and wires them to existing skills", () => {
  const g = applyOps(graph(), [{ op: "add", kind: "course", title: "Deep Learning", description: "", phaseId: "ph2", weeks: 3, searchQuery: "deep learning pytorch", builds: ["ts:prog", "unknown"] }]);
  const added = g.nodes.find((n) => n.title === "Deep Learning")!;
  assert.ok(added.links?.every((l) => l.url.startsWith("https://")));
  assert.deepEqual(g.edges.filter((e) => e.from === added.id).map((e) => e.to), ["skill:ts:prog"]);
});

test("applyOps ignores unknown phases and ids", () => {
  const before = graph();
  const g = applyOps(before, [{ op: "move", id: "c2", phaseId: "nope" }, { op: "update", id: "missing", title: "x" }, { op: "add", kind: "course", title: "Ghost", description: "", phaseId: "ph9", weeks: 1, searchQuery: "", builds: [] }]);
  assert.equal(g.nodes.find((n) => n.id === "c2")!.phaseId, "ph1");
  assert.ok(!g.nodes.some((n) => n.title === "Ghost"));
});

test("set_hours rescales remaining work but not completed work", () => {
  const g = applyOps(graph(), [{ op: "set_hours", hoursPerWeek: 20 }]);
  assert.equal(g.nodes.find((n) => n.id === "c1")!.weeks, 2, "done item unchanged");
  assert.equal(g.nodes.find((n) => n.id === "c2")!.weeks, 1.5, "3 weeks at 10h → 1.5 weeks at 20h");
});

test("diffGraphs and roadmapProgress summarise changes and completion", () => {
  const a = graph();
  const b = applyOps(a, [{ op: "remove", id: "c2" }, { op: "update", id: "p1", weeks: 2 }]);
  const d = diffGraphs(a, b);
  assert.equal(d.removed.length, 1);
  assert.equal(d.changed.length, 1);
  assert.deepEqual(roadmapProgress(a), { items: 3, done: 1, percent: Math.round((2 / 9) * 100) });
});

test("RIASEC scoring averages answers onto a 0–1 scale and builds a Holland code", () => {
  const scores = scoreRiasec({ r1: 1, r2: 1, i1: 5, i2: 5, a1: 3, a2: 3, s1: 2, s2: 2, e1: 4, e2: 4, c1: 4, c2: 5 });
  assert.equal(scores.Realistic, 0);
  assert.equal(scores.Investigative, 1);
  assert.equal(scores.Artistic, 0.5);
  assert.equal(hollandCode(scores), "ICE");
});

test("course links are search URLs, never invented course pages", () => {
  const links = courseSearchLinks("Operating Systems");
  assert.deepEqual(links.map((l) => l.provider), ["NPTEL", "Coursera", "YouTube"]);
  assert.ok(links.every((l) => /search|results/.test(l.url) && l.url.includes("Operating%20Systems")));
});
