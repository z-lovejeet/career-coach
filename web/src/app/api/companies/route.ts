import { suggestCompanies } from "@/server/agents/companies";
import { career } from "@/server/onet/catalogue";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";

export const maxDuration = 60;

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data } = await supabase.from("company_suggestions").select("target, data, created_at").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return ok(data ?? null);
  } catch (error) {
    return handleError(error, "companies:get");
  }
}

/** Generate company suggestions for the student's current target career. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const body = await readJSON<{ targetCode?: string }>(request).catch(() => ({} as { targetCode?: string }));
    await enforceQuota(session, "companies", 10);
    const [{ data: profile }, { data: roadmap }, { data: matches }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("roadmaps").select("target").eq("profile_id", user.id).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("career_matches").select("matches").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const code = body.targetCode ?? roadmap?.target?.code ?? matches?.matches?.[0]?.code;
    const target = code ? career(code)?.title : profile?.goals?.targetRoles?.[0];
    if (!profile || !target) return fail(400, "no_target", "Analyse your profile or create a roadmap first.");

    const result = await suggestCompanies(profile, target);
    await supabase.from("company_suggestions").insert({ profile_id: user.id, target, data: result.companies });
    return ok({ target, data: result.companies, created_at: new Date().toISOString(), model: result.model });
  } catch (error) {
    return handleError(error, "companies:post");
  }
}
