import { analyseProfile, targetJobZone } from "@/server/agents/profile-analyst";
import { matchCareers } from "@/server/ml/matcher";
import { recordActivity } from "@/server/services/activity";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";

export const maxDuration = 60;

/**
 * Hybrid pipeline: Profile Analyst (LLM) → O*NET feature vector → career matcher (ML).
 * Body: { complete?: boolean } — marks onboarding as finished.
 */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const body = await readJSON<{ complete?: boolean }>(request).catch(() => ({ complete: false }));
    await enforceQuota(session, "analyze", 15);

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) throw error;
    if (!profile.skills?.length && !profile.education?.degree && !profile.projects?.length) {
      return fail(400, "profile_empty", "Add your education or a few skills first.");
    }

    const { analysis, vector, meta } = await analyseProfile(profile);
    const { matches, families, modelVersion } = matchCareers(vector, { limit: 12, maxJobZone: Math.ceil(targetJobZone(profile)) });

    const update: Record<string, unknown> = { onet_vector: vector, analysis };
    if (body.complete) update.onboarding_complete = true;
    const [{ error: saveError }, { error: matchError }] = await Promise.all([
      supabase.from("profiles").update(update).eq("id", user.id),
      supabase.from("career_matches").insert({ profile_id: user.id, matches, families, model_version: modelVersion }),
    ]);
    if (saveError || matchError) throw saveError ?? matchError;
    if (body.complete && !profile.onboarding_complete) await recordActivity(user.id, "profile_completed");

    return ok({ analysis, matches, families, model: meta.model, cached: meta.cached });
  } catch (error) {
    return handleError(error, "profile/analyze");
  }
}
