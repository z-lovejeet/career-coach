import "server-only";
import { z } from "zod";
import { completeJSON } from "@/server/ai/groq";
import { TTL } from "@/server/ai/cache";
import { describeProfile } from "./profile-analyst";
import type { Profile } from "@/lib/types";

/**
 * Company Scout agent (hybrid).
 *  - LLM: proposes real companies in India that hire for the target career, the roles, what they look for.
 *  - Code: computes the fit score from overlap between what each company looks for and the student's skills.
 */
const schema = z.object({
  companies: z.array(z.object({
    name: z.string(),
    type: z.enum(["product", "service", "startup", "research", "finance", "consulting"]).catch("product"),
    roles: z.array(z.string()).min(1).max(3),
    lookFor: z.array(z.string()).min(2).max(8),
    why: z.string(),
    prepare: z.string(),
    locations: z.array(z.string()).max(4).catch([]),
    tier: z.enum(["reach", "target", "safe"]).catch("target"),
  })).min(4).max(9),
});

export type CompanySuggestion = z.infer<typeof schema>["companies"][number] & { fit: number; matched: string[]; missing: string[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

export function skillOverlap(lookFor: string[], skills: string[]) {
  const mine = skills.map(norm);
  const matched = lookFor.filter((l) => { const n = norm(l); return mine.some((m) => m.length > 1 && (n.includes(m) || m.includes(n))); });
  return { matched, missing: lookFor.filter((l) => !matched.includes(l)) };
}

export async function suggestCompanies(profile: Partial<Profile>, target: string) {
  const g = profile.goals ?? {};
  const prompt = `TARGET CAREER: ${target}
PREFERRED LOCATIONS: ${(g.locations ?? []).join(", ") || "any in India"}
DREAM COMPANIES: ${(g.dreamCompanies ?? []).join(", ") || "none given"}
STUDENT
${describeProfile(profile)}`;
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `You are a placement advisor for Indian engineering students. Suggest 6-8 REAL companies that hire freshers/interns in India for the target career.
Mix tiers: 2 "reach" (top product/research), 3-4 "target", 1-2 "safe" (large service or mid-size). Include a dream company if it fits.
For each: name, type, roles (entry-level titles), lookFor (4-6 concrete skills/technologies they screen for), why (one sentence tied to THIS student),
prepare (one specific action), locations (Indian cities). Do not invent salaries or claim live openings.
Return {"companies":[{"name":"","type":"product","roles":[],"lookFor":[],"why":"","prepare":"","locations":[],"tier":"target"}]}`,
    prompt,
    schema,
    maxTokens: 2200,
    temperature: 0.4,
    cache: { namespace: "companies", key: [prompt], ttl: TTL.week },
  });

  const skills = [...(profile.skills ?? []).map((s) => s.name), ...(profile.projects ?? []).flatMap((p) => p.tech)];
  const companies: CompanySuggestion[] = data.companies.map((c) => {
    const { matched, missing } = skillOverlap(c.lookFor, skills);
    const coverage = matched.length / c.lookFor.length;
    const tierAdj = c.tier === "reach" ? -12 : c.tier === "safe" ? 10 : 0;
    return { ...c, matched, missing, fit: Math.max(15, Math.min(97, Math.round(35 + coverage * 55 + tierAdj))) };
  }).sort((a, b) => b.fit - a.fit);
  return { companies, model: meta.model, cached: meta.cached };
}
