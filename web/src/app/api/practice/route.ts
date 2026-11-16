import { handleError, ok, requireUser } from "@/server/http";

/** Recent sessions + accuracy per subject/topic. */
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("practice_sessions")
      .select("id, subject, topic, difficulty, correct, total, status, started_at, completed_at, responses")
      .eq("profile_id", user.id).order("started_at", { ascending: false }).limit(100);
    if (error) throw error;
    const stats: Record<string, { correct: number; answered: number }> = {};
    for (const s of data ?? []) {
      const key = `${s.subject}::${s.topic}`;
      const answered = (s.responses as unknown[]).length;
      stats[key] ??= { correct: 0, answered: 0 };
      stats[key].correct += s.correct;
      stats[key].answered += answered;
    }
    return ok({ sessions: (data ?? []).slice(0, 12).map(({ responses, ...s }) => ({ ...s, answered: (responses as unknown[]).length })), stats });
  } catch (error) {
    return handleError(error, "practice:list");
  }
}
