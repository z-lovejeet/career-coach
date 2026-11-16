import { handleError, ok, requireUser } from "@/server/http";
import type { RoadmapGraph } from "@/lib/types";

/** The student's roadmaps with progress, newest first. */
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("roadmaps")
      .select("id, title, target, settings, graph, version, updated_at, created_at")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ok((data ?? []).map(({ graph, ...r }) => {
      const g = graph as RoadmapGraph;
      const work = g.nodes.filter((n) => n.kind === "course" || n.kind === "project");
      return { ...r, totalWeeks: g.totalWeeks, items: work.length, done: work.filter((n) => n.status === "done").length, phases: g.phases.length };
    }));
  } catch (error) {
    return handleError(error, "roadmap:list");
  }
}
