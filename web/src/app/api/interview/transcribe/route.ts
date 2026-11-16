import { transcribe } from "@/server/ai/groq";
import { enforceQuota, fail, handleError, ok, requireUser } from "@/server/http";

export const maxDuration = 60;

/** Speech-to-text for spoken answers (Groq Whisper, with model fallback). */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    await enforceQuota(session, "transcribe", 120);
    const form = await request.formData().catch(() => null);
    const audio = form?.get("audio");
    if (!(audio instanceof Blob) || audio.size < 1000) return fail(400, "no_audio", "We didn't catch any audio. Try again.");
    if (audio.size > 15 * 1024 * 1024) return fail(413, "too_long", "That recording is too long — keep answers under a few minutes.");
    const text = await transcribe(audio, "answer.webm");
    return ok({ text });
  } catch (error) {
    return handleError(error, "interview:transcribe");
  }
}
