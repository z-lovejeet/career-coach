import "server-only";
import model from "./model/career-model.json";
import { career, catalogue } from "@/server/onet/catalogue";
import type { CareerMatch, FamilyFit } from "@/lib/types";

/**
 * Inference for the career matcher trained in ml/src/train.py.
 *   1. Missing features are imputed with the training mean (as during training).
 *   2. Logistic regression (softmax) → probability of each career family.
 *   3. z-scored cosine similarity to every O*NET occupation profile → ranked careers.
 *      score = α·cos + (1−α)·P(family). α was chosen on held-out data (see ml/reports).
 */

type Model = typeof model;
const M: Model = model;
const FEATURE_IDS = M.features.map((f) => f.id);
const FEATURE_INDEX = new Map(FEATURE_IDS.map((id, i) => [id, i]));

export const modelInfo = {
  name: M.name,
  version: M.version,
  trainedAt: M.trainedAt,
  onetVersion: M.onetVersion,
  alpha: M.alpha,
  metrics: M.metrics,
  features: M.features,
};

export function featureList() {
  return M.features;
}

/** Build the dense model input from a sparse {featureId: 0–1} map. */
export function toVector(sparse: Record<string, number>): number[] {
  return FEATURE_IDS.map((id, i) => {
    const v = sparse[id];
    return typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : M.impute[i];
  });
}

const SKILL_IDX = FEATURE_IDS.map((id, i) => (/^(es|ts|kn):/.test(id) ? i : -1)).filter((i) => i >= 0);

/**
 * Distribution alignment. The Profile Analyst rates *proficiency* (mostly 0–3 for students), while
 * occupation features are *importance* ratings with a different spread. We keep the student's relative
 * profile (z-score across their own skill ratings) and re-express it on each feature's occupation scale.
 * Interests and preparation level are already on the occupation scale and pass through unchanged.
 */
export function alignStudent(x: number[], provided: Set<number>): number[] {
  const idx = SKILL_IDX.filter((i) => provided.has(i));
  if (idx.length < 5) return x;
  const vals = idx.map((i) => x[i]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
  const out = [...x];
  for (const i of idx) out[i] = Math.min(1, Math.max(0, M.zMean[i] + ((x[i] - mean) / std) * M.zStd[i]));
  return out;
}

function studentInput(sparse: Record<string, number>) {
  const provided = new Set(FEATURE_IDS.map((id, i) => (typeof sparse[id] === "number" ? i : -1)).filter((i) => i >= 0));
  return alignStudent(toVector(sparse), provided);
}

function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const e = z.map((v) => Math.exp(v - max));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

export function familyProbabilities(x: number[]): FamilyFit[] {
  const scaled = x.map((v, i) => (v - M.scaler.mean[i]) / (M.scaler.scale[i] || 1));
  const logits = M.logreg.coef.map((row, k) => row.reduce((s, w, i) => s + w * scaled[i], M.logreg.intercept[k]));
  // Temperature scaling (fitted on held-out data) keeps the probabilities calibrated.
  const T = (M as { temperature?: number }).temperature ?? 1;
  return softmax(logits.map((l) => l / T)).map((p, k) => ({ code: M.families[k].code, name: M.families[k].name, probability: p }));
}

function zNormalise(x: number[]): number[] {
  const z = x.map((v, i) => (v - M.zMean[i]) / M.zStd[i]);
  const norm = Math.hypot(...z) || 1;
  return z.map((v) => v / norm);
}

export interface MatchOptions {
  limit?: number;
  /** Highest O*NET job zone the student can realistically reach (education). */
  maxJobZone?: number;
}

export function matchCareers(sparse: Record<string, number>, options: MatchOptions = {}) {
  const x = studentInput(sparse);
  const families = familyProbabilities(x);
  const z = zNormalise(x);
  const { codes, familyIndex, z: occ } = M.occupations;
  const maxZone = options.maxJobZone ?? 5;

  const scored = codes.map((code, i) => {
    const cos = occ[i].reduce((s, w, j) => s + w * z[j], 0);
    const score = M.alpha * cos + (1 - M.alpha) * families[familyIndex[i]].probability;
    const zone = catalogue[code]?.jobZone ?? 3;
    // Gentle penalty for careers that need more preparation than the student is heading for.
    const penalty = Math.max(0, zone - maxZone) * 0.08;
    return { code, cos, score: score - penalty };
  });

  scored.sort((a, b) => b.score - a.score);
  const matches: CareerMatch[] = scored.slice(0, options.limit ?? 12).map(({ code, cos }) => {
    const info = career(code)!;
    return {
      code,
      title: info.title,
      family: info.family,
      match: Math.round(Math.min(99, Math.max(1, (cos + 1) * 50))),
      jobZone: info.jobZone,
      description: info.description,
      topSkills: info.requirements.slice(0, 5).map((r) => r.name),
    };
  });

  return {
    matches,
    families: families.sort((a, b) => b.probability - a.probability).slice(0, 6),
    modelVersion: M.version,
  };
}

/** Similarity of a student vector to one specific occupation (0–100). */
export function similarityTo(sparse: Record<string, number>, code: string): number | null {
  const i = M.occupations.codes.indexOf(code);
  if (i < 0) return null;
  const z = zNormalise(studentInput(sparse));
  const cos = M.occupations.z[i].reduce((s, w, j) => s + w * z[j], 0);
  return Math.round(Math.min(99, Math.max(1, (cos + 1) * 50)));
}

export function featureIndex(id: string) {
  return FEATURE_INDEX.get(id);
}
