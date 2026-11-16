import { z } from "zod";
import { generateQuestions } from "@/server/agents/practice";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";
import { findSubject } from "@/lib/subjects";

export const maxDuration = 60;

const bodySchema = z.object({
  subject: z.string().max(60),
  topic: z.string().trim().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
  count: z.coerce.number().int().min(3).max(15).catch(10),
});

/** Start a session: unseen questions from the shared bank first, generate the rest with Groq. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const parsed = bodySchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid", "Choose a subject, topic and difficulty.");
    const subject = findSubject(parsed.data.subject);
    if (!subject) return fail(400, "invalid_subject", "Unknown subject.");
    const { topic, difficulty, count } = parsed.data;

    const seen = await supabase.from("practice_sessions").select("question_ids").eq("profile_id", user.id).eq("subject", subject.name).eq("topic", topic);
    const seenIds = new Set((seen.data ?? []).flatMap((s) => s.question_ids as string[]));
    const bank = async () => {
      const { data } = await supabase.from("practice_questions").select("id").eq("subject", subject.name).eq("topic", topic).eq("difficulty", difficulty).limit(200);
      return (data ?? []).map((q) => q.id as string).filter((id) => !seenIds.has(id));
    };

    let fresh = await bank();
    let generated = 0;
    if (fresh.length < count) {
      await enforceQuota(session, "practice-generate", 20);
      const result = await generateQuestions(subject.name, subject.id, topic, difficulty, Math.min(10, count - fresh.length + 2));
      generated = result.inserted;
      fresh = await bank();
    }
    if (!fresh.length) return fail(503, "no_questions", "Couldn't prepare questions right now. Try again in a moment.");

    const ids = fresh.sort(() => Math.random() - 0.5).slice(0, count);
    const { data: created, error } = await supabase.from("practice_sessions").insert({
      profile_id: user.id, subject: subject.name, topic, difficulty, question_ids: ids, total: ids.length,
    }).select("id").single();
    if (error) throw error;
    return ok({ id: created.id, generated, fromBank: ids.length - Math.min(generated, ids.length) });
  } catch (error) {
    return handleError(error, "practice/start");
  }
}
