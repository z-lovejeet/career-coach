import { z } from "zod";
import { nextTurn, writeReport, type InterviewConfig, type InterviewState, type Turn } from "@/server/agents/interviewer";
import { describeProfile } from "@/server/agents/profile-analyst";
import { recordActivity } from "@/server/services/activity";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";

export const maxDuration = 90;

const bodySchema = z.union([
  z.object({ answer: z.string().trim().min(1).max(6000) }),
  z.object({ end: z.literal(true) }),
]);

/** Candidate answers → interviewer assesses, decides (follow-up / next / close) and replies. */
export async function POST(request: Request, ctx: RouteContext<"/api/interview/[id]/turn">) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid", "Type or record an answer first.");
    await enforceQuota(session, "interview-turn", 80);

    const { data: interview, error } = await supabase.from("interviews").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle();
    if (error) throw error;
    if (!interview) return fail(404, "not_found", "Interview not found.");
    if (interview.status !== "active") return fail(409, "finished", "This interview has already finished.");

    const config = interview.config as InterviewConfig;
    const state = interview.state as InterviewState;
    const transcript = interview.transcript as Turn[];
    const now = () => new Date().toISOString();

    let closing = false;
    if ("answer" in parsed.data) {
      transcript.push({ role: "candidate", content: parsed.data.answer, at: now() });
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const turn = await nextTurn(config, transcript, state, describeProfile(profile ?? {}));
      state.notes.push({ question: turn.question, answer: turn.answer, score: turn.assessment.score, note: turn.assessment.note });
      if (turn.decision === "follow_up") state.followUps += 1;
      if (turn.decision === "next") { state.asked += 1; state.followUps = 0; }
      transcript.push({ role: "interviewer", content: turn.message, at: now(), kind: turn.decision === "close" ? "closing" : turn.decision === "follow_up" ? "follow_up" : "question" });
      closing = turn.decision === "close";
    } else {
      closing = true;
      transcript.push({ role: "interviewer", content: "Let's stop here — thank you for your time. The panel will put together your feedback now.", at: now(), kind: "closing" });
    }

    if (!closing) {
      const { error: saveError } = await supabase.from("interviews").update({ transcript, state }).eq("id", id);
      if (saveError) throw saveError;
      return ok({ transcript, state: { ...state, notes: undefined }, status: "active" });
    }

    // Close: panel report.
    state.finished = true;
    const notes = state.notes.length ? state.notes : [{ question: transcript[0].content, answer: "(no answer)", score: 0, note: "Candidate ended before answering." }];
    const { report } = await writeReport(config, transcript, notes);
    const { error: saveError } = await supabase.from("interviews").update({
      transcript, state, report, score: Math.round(report.overall), status: "completed", completed_at: now(),
    }).eq("id", id);
    if (saveError) throw saveError;
    await recordActivity(user.id, "interview_completed", { interviewId: id, score: report.overall });
    return ok({ transcript, state, status: "completed", report, score: Math.round(report.overall) });
  } catch (error) {
    return handleError(error, "interview:turn");
  }
}
