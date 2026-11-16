import "server-only";
import { z } from "zod";
import { completeJSON } from "@/server/ai/groq";

/**
 * Interviewer agent. Runs a realistic, adaptive interview:
 *  - opens like a real interviewer at the chosen company,
 *  - after each answer privately scores it and decides: probe with a follow-up, move to the next question, or close,
 *  - finally writes a panel-style report.
 */

export interface InterviewConfig {
  role: string;
  company: string;
  subject: string;         // e.g. "Machine Learning", "DBMS", or "General"
  difficulty: "easy" | "medium" | "hard";
  type: "technical" | "hr" | "mixed";
  questions: number;       // main questions (follow-ups don't count)
  voice: boolean;
}

export interface Turn { role: "interviewer" | "candidate"; content: string; at: string; kind?: "question" | "follow_up" | "closing" }
export interface Note { question: string; answer: string; score: number; note: string }
export interface InterviewState { asked: number; followUps: number; notes: Note[]; finished: boolean }

const persona = (c: InterviewConfig) => `You are a ${c.difficulty === "hard" ? "senior, demanding" : c.difficulty === "easy" ? "friendly" : "professional"} interviewer at ${c.company}, interviewing a student for a ${c.role} role (fresher/intern level).
Interview type: ${c.type === "hr" ? "HR / behavioural" : c.type === "technical" ? `technical — focus on ${c.subject}` : `mixed — technical (${c.subject}) and behavioural`}.
Behave like a real ${c.company} interviewer: use the company's known interview style and values where relevant. Ask ONE question at a time.
Keep each message short and spoken-sounding (2-4 sentences). Never reveal scores or say what the right answer is during the interview.
Coding questions: ask the candidate to explain approach and complexity in words (no IDE).`;

const openSchema = z.object({ message: z.string().min(10) });

export async function openInterview(config: InterviewConfig, candidate: string) {
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `${persona(config)}\nReturn {"message":"..."} — greet the candidate briefly, introduce yourself with a plausible first name and team, then ask the first question.`,
    prompt: `CANDIDATE BACKGROUND (use it to personalise)\n${candidate}\n\nThis interview will have ${config.questions} main questions.`,
    schema: openSchema,
    maxTokens: 500,
    temperature: 0.8,
  });
  return { message: data.message, model: meta.model };
}

const turnSchema = z.object({
  assessment: z.object({ score: z.coerce.number().min(0).max(10), note: z.string() }),
  decision: z.enum(["follow_up", "next", "close"]),
  message: z.string().min(5),
});

export async function nextTurn(config: InterviewConfig, transcript: Turn[], state: InterviewState, candidate: string) {
  const lastQuestion = [...transcript].reverse().find((t) => t.role === "interviewer")?.content ?? "";
  const lastAnswer = transcript[transcript.length - 1]?.content ?? "";
  const remaining = config.questions - state.asked;
  const canFollow = state.followUps < 1;
  const history = transcript.slice(-12).map((t) => `${t.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${t.content}`).join("\n");

  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `${persona(config)}
After the candidate's answer:
1. Privately assess the answer to the CURRENT question: score 0-10 (0 = no answer/wrong, 5 = partially right, 8 = strong, 10 = exceptional) and a one-line note.
2. Decide what a real interviewer would do next:
   - "follow_up": the answer was vague, partly right or interesting — probe deeper on the same question ${canFollow ? "(allowed)" : "(NOT allowed now — you already followed up)"}.
   - "next": move on to a new question (${remaining > 0 ? `${remaining} main questions left` : "no main questions left — do not choose this"}).
   - "close": ${remaining > 0 ? "only if the candidate wants to stop" : "required now — thank them and say the panel will share feedback"}.
3. Write your next spoken message (a brief, natural reaction without giving away the answer, then the follow-up or new question, or the closing).
Return {"assessment":{"score":0,"note":""},"decision":"follow_up|next|close","message":""}`,
    prompt: `CANDIDATE BACKGROUND\n${candidate}\n\nRECENT TRANSCRIPT\n${history}\n\nCURRENT QUESTION: ${lastQuestion}\nCANDIDATE ANSWER: ${lastAnswer}`,
    schema: turnSchema,
    maxTokens: 700,
    temperature: 0.6,
  });

  let decision = data.decision;
  if (decision === "follow_up" && !canFollow) decision = remaining > 0 ? "next" : "close";
  if (decision === "next" && remaining <= 0) decision = "close";
  return { ...data, decision, model: meta.model, question: lastQuestion, answer: lastAnswer };
}

const reportSchema = z.object({
  overall: z.coerce.number().min(0).max(100),
  verdict: z.enum(["Strong hire", "Hire", "Lean hire", "Lean no hire", "No hire"]),
  summary: z.string(),
  dimensions: z.array(z.object({ name: z.string(), score: z.coerce.number().min(0).max(10), comment: z.string() })).min(3).max(6),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
  questions: z.array(z.object({ question: z.string(), score: z.coerce.number().min(0).max(10), feedback: z.string(), betterAnswer: z.string() })).min(1),
  nextSteps: z.array(z.string()).min(1).max(4),
});
export type InterviewReport = z.infer<typeof reportSchema>;

export async function writeReport(config: InterviewConfig, transcript: Turn[], notes: Note[]) {
  const text = transcript.map((t) => `${t.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${t.content}`).join("\n").slice(-12_000);
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: `You are the hiring panel at ${config.company} writing feedback for a ${config.role} interview (${config.type}, ${config.difficulty}).
Score honestly for a fresher. Use the interviewer's private notes as evidence. Dimensions: Technical depth, Problem solving, Communication, Structure & clarity, ${config.company} fit.
For each main question give feedback and a concise outline of a stronger answer. nextSteps: concrete practice actions.
Return {"overall":0-100,"verdict":"Strong hire|Hire|Lean hire|Lean no hire|No hire","summary":"","dimensions":[{"name":"","score":0,"comment":""}],"strengths":[],"improvements":[],"questions":[{"question":"","score":0,"feedback":"","betterAnswer":""}],"nextSteps":[]}`,
    prompt: `PRIVATE NOTES\n${notes.map((n, i) => `${i + 1}. score ${n.score}/10 — ${n.note} (Q: ${n.question.slice(0, 160)})`).join("\n")}\n\nTRANSCRIPT\n${text}`,
    schema: reportSchema,
    maxTokens: 2600,
    temperature: 0.3,
  });
  return { report: data, model: meta.model };
}
