import { career, catalogue } from "@/server/onet/catalogue";
import { similarityTo } from "@/server/ml/matcher";
import { fail, handleError, ok, requireUser } from "@/server/http";

export async function GET(_request: Request, ctx: RouteContext<"/api/careers/[code]">) {
  try {
    const { supabase, user } = await requireUser();
    const { code } = await ctx.params;
    const info = career(code);
    if (!info) return fail(404, "not_found", "Career not found.");
    const { data: profile } = await supabase.from("profiles").select("onet_vector").eq("id", user.id).maybeSingle();
    return ok({
      code,
      ...info,
      related: info.related.map((r) => ({ code: r, title: catalogue[r]?.title })).filter((r) => r.title),
      match: profile?.onet_vector ? similarityTo(profile.onet_vector, code) : null,
    });
  } catch (error) {
    return handleError(error, "careers/code");
  }
}
