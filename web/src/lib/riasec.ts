import type { RiasecType } from "./types";

/**
 * A short Holland-code (RIASEC) interest inventory. Two activity statements per type,
 * rated 1 (dislike) – 5 (love). Scores map onto O*NET's occupational interest profile.
 */
export const RIASEC_TYPES: { type: RiasecType; label: string; blurb: string }[] = [
  { type: "Realistic", label: "Builder", blurb: "Hands-on work with tools, machines and physical systems." },
  { type: "Investigative", label: "Thinker", blurb: "Analysing problems, research and working with ideas." },
  { type: "Artistic", label: "Creator", blurb: "Design, expression and original work without fixed rules." },
  { type: "Social", label: "Helper", blurb: "Teaching, guiding and working with people." },
  { type: "Enterprising", label: "Persuader", blurb: "Leading, selling, starting and influencing." },
  { type: "Conventional", label: "Organiser", blurb: "Structure, data, detail and well-defined processes." },
];

export const RIASEC_ITEMS: { id: string; type: RiasecType; text: string }[] = [
  { id: "r1", type: "Realistic", text: "Assemble a drone, a PC or a robot from parts" },
  { id: "i1", type: "Investigative", text: "Figure out why an algorithm is slow and fix it" },
  { id: "a1", type: "Artistic", text: "Design the look and feel of an app or a poster" },
  { id: "s1", type: "Social", text: "Explain a hard concept to a junior until it clicks" },
  { id: "e1", type: "Enterprising", text: "Pitch an idea to investors or lead a team project" },
  { id: "c1", type: "Conventional", text: "Organise a messy dataset into clean, consistent records" },
  { id: "r2", type: "Realistic", text: "Work in a lab, workshop or out in the field" },
  { id: "i2", type: "Investigative", text: "Read research papers and run experiments" },
  { id: "a2", type: "Artistic", text: "Write, film, compose or create something original" },
  { id: "s2", type: "Social", text: "Mentor people or volunteer for a cause" },
  { id: "e2", type: "Enterprising", text: "Negotiate a deal or grow a small business" },
  { id: "c2", type: "Conventional", text: "Plan budgets, schedules or audit a process for errors" },
];

/** Average each type's answers and normalise 1–5 → 0–1. */
export function scoreRiasec(answers: Record<string, number>): Record<RiasecType, number> {
  const out = {} as Record<RiasecType, number>;
  for (const { type } of RIASEC_TYPES) {
    const values = RIASEC_ITEMS.filter((i) => i.type === type).map((i) => answers[i.id]).filter((v) => typeof v === "number");
    out[type] = values.length ? (values.reduce((a, b) => a + b, 0) / values.length - 1) / 4 : 0.5;
  }
  return out;
}

/** Top-three Holland code, e.g. "IRC". */
export function hollandCode(scores: Partial<Record<RiasecType, number>>): string {
  return Object.entries(scores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 3).map(([t]) => t[0]).join("");
}
