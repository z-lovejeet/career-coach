import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { completeJSON, streamText, type ChatMessage } from "@/server/ai/groq";
import { career, careerBrief, JOB_ZONES, searchCareers } from "@/server/onet/catalogue";
import { matchCareers } from "@/server/ml/matcher";
import { progressContext } from "@/server/services/progress";
import { describeProfile } from "./profile-analyst";
import type { Profile, RoadmapGraph } from "@/lib/types";

/**
 * Mentor agent — plan → act → answer.
 *  1. Planner (fast model, JSON) decides which tools the question needs.
 *  2. Tools run locally against O*NET, the career model and the student's own data.
 *  3. The answer is streamed by the reasoning model with the tool results as context.
 */

export const TOOLS = {
  career_info: "Facts about one career from O*NET (description, tasks, skills, technologies, preparation). args: {\"query\": career name}",
  search_careers: "Find careers related to an interest or keyword. args: {\"query\": keywords}",
  career_matches: "The student's top career matches from the ML model. args: {}",
  my_progress: "The student's readiness, practice accuracy, weak topics, interviews, streak. args: {}",
  my_roadmap: "The student's current roadmap: phases, next steps, completion. args: {}",
} as const;
type ToolName = keyof typeof TOOLS;

const planSchema = z.object({
  tools: z.array(z.object({ name: z.enum(Object.keys(TOOLS) as [ToolName, ...ToolName[]]), query: z.string().optional() })).max(3),
});

async function runTool(name: ToolName, query: string | undefined, ctx: { supabase: SupabaseClient; userId: string; profile: Partial<Profile> }) {
  switch (name) {
    case "career_info": {
      const hit = query ? searchCareers(query, 1)[0] : undefined;
      if (!hit) return "No matching career found in O*NET.";
      const c = career(hit.code)!;
      return `${careerBrief(hit.code)}\nPreparation: ${JOB_ZONES[c.jobZone]}\nRelated: ${c.related.slice(0, 4).map((r) => career(r)?.title).filter(Boolean).join(", ")}`;
    }
    case "search_careers": {
      const hits = query ? searchCareers(query, 6) : [];
      return hits.length ? hits.map((h) => `- ${h.title} (${h.family})`).join("\n") : "No careers found.";
    }
    case "career_matches": {
      if (!ctx.profile.onet_vector) return "The student hasn't been analysed yet.";
      const { matches, families } = matchCareers(ctx.profile.onet_vector, { limit: 6 });
      return `Top matches: ${matches.map((m) => `${m.title} ${m.match}%`).join(", ")}\nFamilies: ${families.slice(0, 3).map((f) => `${f.name} ${Math.round(f.probability * 100)}%`).join(", ")}`;
    }
    case "my_progress":
      return progressContext(ctx.supabase, ctx.userId);
    case "my_roadmap": {
      const { data } = await ctx.supabase.from("roadmaps").select("title, graph").eq("profile_id", ctx.userId).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (!data) return "No roadmap yet.";
      const g = data.graph as RoadmapGraph;
      const work = g.nodes.filter((n) => n.kind === "course" || n.kind === "project");
      return `${data.title} (${g.totalWeeks} weeks, ${work.filter((n) => n.status === "done").length}/${work.length} done)\n` +
        g.phases.map((p) => `${p.title}: ${work.filter((n) => n.phaseId === p.id).map((n) => `${n.title}${n.status === "done" ? " ✓" : n.status === "doing" ? " (in progress)" : ""}`).join("; ")}`).join("\n");
    }
  }
}

export const TOOL_LABELS: Record<ToolName, string> = {
  career_info: "O*NET career data",
  search_careers: "O*NET career search",
  career_matches: "Career model",
  my_progress: "Your progress",
  my_roadmap: "Your roadmap",
};

export async function mentorAnswer(opts: {
  supabase: SupabaseClient; userId: string; profile: Partial<Profile>; history: ChatMessage[]; message: string;
}) {
  const { supabase, userId, profile, history, message } = opts;

  // 1 — plan
  let plan: z.infer<typeof planSchema> = { tools: [] };
  try {
    const res = await completeJSON({
      tier: "fast",
      system: `You route a student's question to tools before a mentor answers. Pick 0-3 tools that would make the answer more specific and grounded.
Tools:\n${Object.entries(TOOLS).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
Pure academic questions (e.g. "explain paging") need no tools. Questions about "me", "my plan", "what next" need my_progress and/or my_roadmap.
Return {"tools":[{"name":"career_info","query":"Data Scientist"}]}`,
      prompt: `Recent conversation: ${history.slice(-4).map((m) => `${m.role}: ${typeof m.content === "string" ? m.content.slice(0, 200) : ""}`).join(" | ") || "none"}\nQuestion: ${message}`,
      schema: planSchema,
      maxTokens: 300,
      temperature: 0,
    });
    plan = res.data;
  } catch {
    plan = { tools: [] };
  }

  // 2 — act
  const ctx = { supabase, userId, profile };
  const results = await Promise.all(plan.tools.map(async (t) => ({ ...t, label: TOOL_LABELS[t.name], output: await runTool(t.name, t.query, ctx).catch(() => "Tool failed.") })));

  // 3 — answer (streamed)
  const system = `You are CareerCompass Mentor — a warm, direct career and academic mentor for Indian engineering students.
- Answer career questions (roles, skills, companies, higher studies, placements) and academic questions (CS subjects, maths, ML) with clear explanations and examples.
- Be specific to this student. Use the tool results when given; say "according to O*NET" when citing them. Never invent statistics, salaries or URLs.
- Prefer short paragraphs, bullet lists and small examples. Use markdown. Use code blocks for code. End with one concrete next step when helpful.
STUDENT PROFILE
${describeProfile(profile)}`;
  const toolContext = results.length ? `\n\nTOOL RESULTS\n${results.map((r) => `[${r.name}${r.query ? `: ${r.query}` : ""}]\n${r.output}`).join("\n\n")}` : "";
  const { stream, model } = await streamText({
    tier: "reasoning",
    system: system + toolContext,
    messages: [...history.slice(-10), { role: "user", content: message }],
    maxTokens: 1400,
    temperature: 0.6,
  });
  return { stream, model, tools: results.map((r) => ({ name: r.name, label: r.label, query: r.query })) };
}
