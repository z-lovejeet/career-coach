import { z } from "zod";
import { recordActivity } from "@/server/services/activity";
import { fail, handleError, ok, readJSON, requireUser } from "@/server/http";

const bodySchema = z.object({
  questionId: z.string().uuid(),
  chosen: z.number().int().min(0).max(3).nullable(),  // null = ran out of time
  ms: z.number().int().min(0).max(3_600_000),
});

type Response = { questionId: string; chosen: number | null; correct: boolean; ms: number };

/** Grade one answer server-side and reveal the explanation. */
export async function POST(request: Request, ctx: RouteContext<"/api/practice/[id]/answer">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid", "Invalid answer.");
    const { questionId, chosen, ms } = parsed.data;

    const { data: session, error } = await supabase.from("practice_sessions").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!session) return fail(404, "not_found", "Session not found.");
    if (!(session.question_ids as string[]).includes(questionId)) return fail(400, "not_in_session", "That question isn't part of this session.");

    const { data: q } = await supabase.from("practice_questions").select("answer, explanation").eq("id", questionId).single();
    const responses = session.responses as Response[];
    const existing = responses.find((r) => r.questionId === questionId);
    if (existing) return ok({ correct: existing.correct, answer: q!.answer, explanation: q!.explanation, completed: session.status === "completed" });

    const correct = chosen === q!.answer;
    const next = [...responses, { questionId, chosen, correct, ms }];
    const completed = next.length >= session.total;
    const { error: updateError } = await supabase.from("practice_sessions").update({
      responses: next,
      correct: session.correct + (correct ? 1 : 0),
      ...(completed ? { status: "completed", completed_at: new Date().toISOString() } : {}),
    }).eq("id", id).eq("profile_id", user.id);
    if (updateError) throw updateError;

    if (correct) await recordActivity(user.id, "practice_correct", { sessionId: id });
    if (completed) await recordActivity(user.id, "practice_completed", { sessionId: id, topic: session.topic });
    return ok({ correct, answer: q!.answer, explanation: q!.explanation, completed });
  } catch (error) {
    return handleError(error, "practice:answer");
  }
}
