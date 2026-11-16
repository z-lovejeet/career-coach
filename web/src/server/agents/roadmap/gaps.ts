import "server-only";
import { career } from "@/server/onet/catalogue";
import { modelInfo } from "@/server/ml/matcher";
import type { Profile, SkillGap } from "@/lib/types";

/**
 * Gap Analyzer (deterministic).
 * For each O*NET requirement of the target career: gap = max(0, required level − student level) × importance.
 * Student level comes from the Profile Analyst's 0–1 rating; required level is O*NET's level scale (0–7 → 0–1).
 */
export function analyseGaps(code: string, vector: Record<string, number>) {
  const info = career(code);
  if (!info) throw new Error(`Unknown occupation ${code}`);
  const impute = new Map(modelInfo.features.map((f, i) => [f.id, i]));
  const gaps: SkillGap[] = info.requirements.map((r) => {
    const required = r.level ?? r.importance;
    const current = vector[r.id] ?? 0;
    return {
      id: r.id,
      name: r.name,
      required: round(required),
      current: round(current),
      importance: round(r.importance),
      gap: round(Math.max(0, required - current) * (0.5 + r.importance)),
    };
  }).filter((g) => impute.has(g.id));

  gaps.sort((a, b) => b.gap - a.gap);
  return { info, gaps };
}

/** Technologies the occupation uses that the student hasn't listed. */
export function missingTechnologies(code: string, profile: Partial<Profile>) {
  const info = career(code);
  if (!info) return [];
  const known = (profile.skills ?? []).map((s) => s.name.toLowerCase());
  return info.technologies.filter((t) => !known.some((k) => t.toLowerCase().includes(k) || k.includes(t.toLowerCase()))).slice(0, 8);
}

/** Coverage score (0–100): how much of the target's weighted requirement level the student already meets. */
export function coverage(gaps: SkillGap[]) {
  const total = gaps.reduce((s, g) => s + g.required * (0.5 + g.importance), 0) || 1;
  const met = gaps.reduce((s, g) => s + Math.min(g.current, g.required) * (0.5 + g.importance), 0);
  return Math.round((met / total) * 100);
}

const round = (n: number) => Math.round(n * 1000) / 1000;
