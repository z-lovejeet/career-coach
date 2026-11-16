import "server-only";
import { z } from "zod";
import { completeJSON } from "@/server/ai/groq";
import { adminClient } from "@/server/db/supabase";

/**
 * Question Setter agent. Generates MCQs into a shared bank (service-role writes), so the bank grows
 * with use and repeated topics need no new AI calls. Answers never leave the server until answered.
 */
const questionSchema = z.object({
  question: z.string().min(10).max(900),
  options: z.array(z.string().min(1).max(300)).length(4),
  answer: z.coerce.number().int().min(0).max(3),
  explanation: z.string().min(10).max(900),
});
const batchSchema = z.object({ questions: z.array(questionSchema.catch(null as never)).min(1).transform((q) => q.filter(Boolean)) });

const STYLE: Record<string, string> = {
  quant: "Use realistic placement-test numbers. Compute the answer step by step before writing options; the correct option must be exactly right. Explanation shows the working.",
  logical: "Write self-contained reasoning puzzles with exactly one valid answer. Explanation shows the deduction.",
  verbal: "Use natural Indian-English exam style. For comprehension include a short passage inside the question.",
  code: "Include a short code snippet inside the question using markdown code fences. Trace it carefully; the explanation walks through execution.",
};

export async function generateQuestions(subject: string, subjectId: string, topic: string, difficulty: string, count: number) {
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `You write accurate multiple-choice questions for Indian engineering students (university exams, GATE-style and placement tests).
Rules: exactly 4 options, one correct; plausible distractors based on common mistakes; no "all of the above"; vary the position of the correct answer;
difficulty "${difficulty}" (easy = recall/one step, medium = application, hard = multi-step reasoning). ${STYLE[subjectId] ?? "Test understanding, not trivia."}
Return {"questions":[{"question":"","options":["","","",""],"answer":0,"explanation":"why the answer is right and the common trap"}]}`,
    prompt: `Subject: ${subject}\nTopic: ${topic}\nWrite ${count} distinct questions.`,
    schema: batchSchema,
    maxTokens: Math.min(4000, 380 * count + 300),
    temperature: 0.7,
  });

  const rows = data.questions
    .filter((q) => new Set(q.options.map((o) => o.trim().toLowerCase())).size === 4)
    .map((q) => ({ subject, topic, difficulty, question: q.question.trim(), options: q.options, answer: q.answer, explanation: q.explanation, source_model: meta.model }));
  // Insert individually so a duplicate (unique index on subject + question) only skips that row.
  const results = await Promise.all(rows.map((row) => adminClient().from("practice_questions").insert(row)));
  return { inserted: results.filter((r) => !r.error).length, model: meta.model };
}
