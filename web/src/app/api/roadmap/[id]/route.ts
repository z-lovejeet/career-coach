import { z } from "zod";
import { graphSchema } from "@/server/services/roadmap-schema";
import { recordActivity } from "@/server/services/activity";
import { layoutPhases } from "@/server/agents/roadmap/pipeline";
import { fail, handleError, ok, readJSON, requireUser } from "@/server/http";
import type { RoadmapGraph } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/roadmap/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const { data, error } = await supabase.from("roadmaps").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) return fail(404, "not_found", "Roadmap not found.");
    const { data: revisions } = await supabase.from("roadmap_revisions").select("id, version, note, created_at")
      .eq("roadmap_id", id).order("version", { ascending: false }).limit(15);
    return ok({ ...data, revisions: revisions ?? [] });
  } catch (error) {
    return handleError(error, "roadmap:get");
  }
}

const patchSchema = z.object({
  graph: graphSchema.optional(),
  title: z.string().trim().min(1).max(120).optional(),
  note: z.string().max(200).optional(),
  restoreVersion: z.number().int().min(1).optional(),
  expectedVersion: z.number().int().min(1).optional(),
});

/** Save edits (new version + revision). Awards XP for newly completed steps. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/roadmap/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid_roadmap", parsed.error.issues[0]?.message ?? "Invalid roadmap.");
    const { data: current, error } = await supabase.from("roadmaps").select("graph, version").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!current) return fail(404, "not_found", "Roadmap not found.");
    if (parsed.data.expectedVersion && parsed.data.expectedVersion !== current.version) {
      return fail(409, "stale", "This roadmap changed in another tab. Reload to see the latest version.");
    }

    let graph = parsed.data.graph as RoadmapGraph | undefined;
    let note = parsed.data.note ?? "Edited";
    if (parsed.data.restoreVersion) {
      const { data: rev } = await supabase.from("roadmap_revisions").select("graph").eq("roadmap_id", id).eq("version", parsed.data.restoreVersion).maybeSingle();
      if (!rev) return fail(404, "no_version", "That version no longer exists.");
      graph = rev.graph as RoadmapGraph;
      note = `Restored version ${parsed.data.restoreVersion}`;
    }

    const update: Record<string, unknown> = {};
    if (parsed.data.title) update.title = parsed.data.title;
    const version = current.version + (graph ? 1 : 0);
    if (graph) {
      layoutPhases(graph);
      update.graph = graph;
      update.version = version;
    }
    const { data: saved, error: saveError } = await supabase.from("roadmaps").update(update).eq("id", id).eq("profile_id", user.id).select("*").single();
    if (saveError) throw saveError;

    if (graph) {
      await supabase.from("roadmap_revisions").insert({ roadmap_id: id, profile_id: user.id, version, graph, note });
      const before = new Set((current.graph as RoadmapGraph).nodes.filter((n) => n.status === "done").map((n) => n.id));
      const newlyDone = graph.nodes.filter((n) => n.status === "done" && !before.has(n.id) && n.kind !== "career");
      for (const node of newlyDone.slice(0, 10)) await recordActivity(user.id, "roadmap_step_done", { roadmapId: id, node: node.title });
    }
    return ok(saved);
  } catch (error) {
    return handleError(error, "roadmap:patch");
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/roadmap/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const { error } = await supabase.from("roadmaps").update({ status: "archived" }).eq("id", id).eq("profile_id", user.id);
    if (error) throw error;
    return ok({ archived: true });
  } catch (error) {
    return handleError(error, "roadmap:delete");
  }
}
