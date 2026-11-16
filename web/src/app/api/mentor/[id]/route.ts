import { fail, handleError, ok, requireUser } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/mentor/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const { data: thread } = await supabase.from("mentor_threads").select("id, title").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (!thread) return fail(404, "not_found", "Conversation not found.");
    const { data } = await supabase.from("mentor_messages").select("id, role, content, meta, created_at").eq("thread_id", id).order("created_at", { ascending: true });
    return ok({ ...thread, messages: data ?? [] });
  } catch (error) {
    return handleError(error, "mentor:get");
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/mentor/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const { error } = await supabase.from("mentor_threads").delete().eq("id", id).eq("profile_id", user.id);
    if (error) throw error;
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "mentor:delete");
  }
}
