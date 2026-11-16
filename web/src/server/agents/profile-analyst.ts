import "server-only";
import { z } from "zod";
import { completeJSON, type CallMeta } from "@/server/ai/groq";
import { TTL } from "@/server/ai/cache";
import { featureList } from "@/server/ml/matcher";
import type { Profile, ProfileAnalysis, RiasecType } from "@/lib/types";

/**
 * Profile Analyst agent — the bridge between a free-form student profile and the ML model.
 * It rates the student on every O*NET skill and knowledge descriptor (0–5), and writes a short
 * assessment. Interests come from the RIASEC quiz and preparation level from education,
 * both computed deterministically.
 */

const SKILL_FEATURES = featureList().filter((f) => f.id.startsWith("es:") || f.id.startsWith("ts:") || f.id.startsWith("kn:"));

const outputSchema = z.object({
  summary: z.string().min(20),
  strengths: z.array(z.string()).min(1).max(6),
  growthAreas: z.array(z.string()).min(1).max(6),
  ratings: z.record(z.string(), z.coerce.number().min(0).max(5)),
});

const SYSTEM = `You are a careers analyst. You read a student's profile and rate them on O*NET descriptors.
For each numbered descriptor give an integer 0-5 for how strongly this student shows it — combining evidence of
ability (courses, projects, experience, self-rated skills) and stated interest:
0 = no sign at all, 1 = slight, 2 = some exposure, 3 = solid, 4 = strong, 5 = exceptional.
Be realistic for a student; most ratings should be 0-3. Reserve 4-5 for clear evidence.
Also write: summary (2-3 sentences, second person, specific), strengths (3-5 short phrases), growthAreas (3-5 short phrases).
Return JSON: {"summary":"","strengths":[],"growthAreas":[],"ratings":{"1":0,"2":3,...}} with a rating for every number.`;

export function describeProfile(p: Partial<Profile>): string {
  const e = p.education ?? {};
  const a = p.academics ?? {};
  const g = p.goals ?? {};
  const lines = [
    `Education: ${[e.degree, e.branch, e.currentYear, e.institution].filter(Boolean).join(", ") || "not given"}${e.cgpa ? ` (CGPA ${e.cgpa})` : ""}`,
    a.coursework?.length ? `Coursework: ${a.coursework.join(", ")}` : "",
    a.strongSubjects?.length ? `Strong subjects: ${a.strongSubjects.join(", ")}` : "",
    a.weakSubjects?.length ? `Weak subjects: ${a.weakSubjects.join(", ")}` : "",
    p.skills?.length ? `Skills (self-rated 1-5): ${p.skills.map((s) => `${s.name} ${s.level}`).join(", ")}` : "",
    ...(p.projects ?? []).slice(0, 6).map((pr) => `Project: ${pr.title} — ${pr.description.slice(0, 220)} [${pr.tech.join(", ")}]`),
    ...(p.experience ?? []).slice(0, 5).map((x) => `Experience: ${x.role} at ${x.organization} (${x.type}, ${x.duration}) — ${x.description.slice(0, 200)}`),
    p.certifications?.length ? `Certifications: ${p.certifications.map((c) => c.name).join(", ")}` : "",
    p.achievements?.length ? `Achievements: ${p.achievements.slice(0, 6).join("; ")}` : "",
    p.interests?.areas?.length ? `Interest areas: ${p.interests.areas.join(", ")}` : "",
    g.targetRoles?.length ? `Target roles: ${g.targetRoles.join(", ")}` : "",
    g.industries?.length ? `Industries: ${g.industries.join(", ")}` : "",
    g.path ? `Path: ${g.path.replace("_", " ")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/** O*NET job zone the student is heading towards, from education + path. */
export function targetJobZone(p: Partial<Profile>): number {
  const degree = `${p.education?.degree ?? ""} ${p.education?.level ?? ""}`.toLowerCase();
  let zone = 4;
  if (/ph\.?d|doctor/.test(degree)) zone = 5;
  else if (/m\.?tech|m\.?e\b|mca|mba|m\.?sc|master|postgrad/.test(degree)) zone = 4.5;
  else if (/diploma|polytechnic|12th|higher secondary|iti/.test(degree)) zone = 3;
  if (p.goals?.path === "higher_studies") zone = Math.min(5, zone + 0.75);
  return zone;
}

export async function analyseProfile(profile: Partial<Profile>): Promise<{
  analysis: ProfileAnalysis; vector: Record<string, number>; meta: CallMeta;
}> {
  const descriptors = SKILL_FEATURES.map((f, i) => `${i + 1}. ${f.name} (${f.group.replace(" skill", "")})`).join("\n");
  const profileText = describeProfile(profile);
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: SYSTEM,
    prompt: `STUDENT PROFILE\n${profileText}\n\nDESCRIPTORS\n${descriptors}`,
    schema: outputSchema,
    maxTokens: 1800,
    temperature: 0.2,
    cache: { namespace: "analyst", key: [profileText], ttl: TTL.week },
  });

  const vector: Record<string, number> = {};
  SKILL_FEATURES.forEach((f, i) => {
    const r = data.ratings[String(i + 1)];
    if (typeof r === "number") vector[f.id] = r / 5;
  });

  const riasec = profile.interests?.riasec ?? {};
  for (const type of ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"] as RiasecType[]) {
    if (typeof riasec[type] === "number") vector[`ri:${type}`] = riasec[type]!;
  }
  vector["jz:zone"] = (targetJobZone(profile) - 1) / 4;

  return {
    analysis: {
      summary: data.summary,
      strengths: data.strengths,
      growthAreas: data.growthAreas,
      model: meta.model,
      analyzedAt: new Date().toISOString(),
    },
    vector,
    meta,
  };
}
