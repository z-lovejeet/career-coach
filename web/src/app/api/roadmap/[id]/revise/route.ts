import { z } from "zod";
import { reviseRoadmap, suggestImprovements } from "@/server/agents/roadmap/revise";
import { progressContext } from "@/server/services/progress";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";
import type { RoadmapGraph } from "@/lib/types";

export const maxDuration = 60;

const bodySchema = z.union([
  z.object({ mode: z.literal("apply"), instruction: z.string().trim().min(3).max(500) }),
  z.object({ mode: z.literal("suggest") }),
]);

/**
 * mode "apply": AI edits the roadmap from a request and returns the proposed graph (not yet saved — the
 *               student reviews it and saves).
 * mode "suggest": AI proposes improvements grounded in the student's progress.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/roadmap/[id]/revise">) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid", "Describe the change you want.");
    await enforceQuota(session, "roadmap-revise", 25);

    const { data: roadmap, error } = await supabase.from("roadmaps").select("graph, target").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!roadmap) return fail(404, "not_found", "Roadmap not found.");
    const graph = roadmap.graph as RoadmapGraph;

    if (parsed.data.mode === "apply") {
      return ok(await reviseRoadmap(graph, parsed.data.instruction, roadmap.target.title));
    }
    return ok(await suggestImprovements(graph, roadmap.target.title, await progressContext(supabase, user.id)));
  } catch (error) {
    return handleError(error, "roadmap/revise");
  }
}
