import { profileUpdateSchema } from "@/server/services/profile-schema";
import { fail, handleError, ok, readJSON, requireUser } from "@/server/http";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return handleError(error, "profile:get");
  }
}

/** Partial update. Unknown keys are dropped; contact fields don't exist in the schema. */
export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const parsed = profileUpdateSchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid_profile", parsed.error.issues[0]?.message ?? "Invalid profile.");
    const { data, error } = await supabase.from("profiles").upsert({ id: user.id, ...parsed.data }).select("*").single();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return handleError(error, "profile:put");
  }
}
