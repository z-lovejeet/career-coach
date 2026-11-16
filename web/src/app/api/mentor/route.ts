import { handleError, ok, requireUser } from "@/server/http";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("mentor_threads").select("id, title, updated_at").eq("profile_id", user.id).order("updated_at", { ascending: false }).limit(40);
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return handleError(error, "mentor:list");
  }
}
