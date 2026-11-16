import { z } from "zod";
import { openInterview, type InterviewConfig, type Turn } from "@/server/agents/interviewer";
import { describeProfile } from "@/server/agents/profile-analyst";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";

export const maxDuration = 60;

const configSchema = z.object({
  role: z.string().trim().min(2).max(80),
  company: z.string().trim().min(2).max(60),
  subject: z.string().trim().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["technical", "hr", "mixed"]),
  questions: z.coerce.number().int().min(3).max(8),
  voice: z.boolean().catch(false),
});

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("interviews").select("id, config, score, status, created_at, completed_at, report->verdict")
      .eq("profile_id", user.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return handleError(error, "interview:list");
  }
}

/** Create an interview and get the interviewer's opening line. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const parsed = configSchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid", "Choose a role, company, subject and difficulty.");
    await enforceQuota(session, "interview", 10);
    const config: InterviewConfig = parsed.data;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const opening = await openInterview(config, describeProfile(profile ?? {}));
    const transcript: Turn[] = [{ role: "interviewer", content: opening.message, at: new Date().toISOString(), kind: "question" }];
    const { data, error } = await supabase.from("interviews").insert({
      profile_id: user.id, config, transcript, state: { asked: 1, followUps: 0, notes: [], finished: false },
    }).select("id").single();
    if (error) throw error;
    return ok({ id: data.id });
  } catch (error) {
    return handleError(error, "interview:create");
  }
}
