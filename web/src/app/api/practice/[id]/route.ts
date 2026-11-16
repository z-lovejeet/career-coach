import { fail, handleError, ok, requireUser } from "@/server/http";

type Response = { questionId: string; chosen: number | null; correct: boolean; ms: number };

/** Session with its questions. Answers/explanations are only included for answered questions. */
export async function GET(_req: Request, ctx: RouteContext<"/api/practice/[id]">) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const { data: session, error } = await supabase.from("practice_sessions").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!session) return fail(404, "not_found", "Session not found.");
    const { data: questions } = await supabase.from("practice_questions").select("id, question, options, answer, explanation").in("id", session.question_ids);
    const byId = new Map((questions ?? []).map((q) => [q.id, q]));
    const responses = session.responses as Response[];
    const answered = new Set(responses.map((r) => r.questionId));
    return ok({
      ...session,
      questions: (session.question_ids as string[]).map((qid) => {
        const q = byId.get(qid);
        if (!q) return null;
        return answered.has(qid) || session.status === "completed" ? q : { id: q.id, question: q.question, options: q.options };
      }).filter(Boolean),
    });
  } catch (error) {
    return handleError(error, "practice:get");
  }
}
