import { fail, handleError, ok, requireUser } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/interview/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const { data, error } = await supabase.from("interviews").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) return fail(404, "not_found", "Interview not found.");
    // Private interviewer notes stay hidden until the interview is over.
    const state = data.status === "completed" ? data.state : { ...data.state, notes: undefined };
    return ok({ ...data, state });
  } catch (error) {
    return handleError(error, "interview:get");
  }
}
