import { z } from "zod";
import { mentorAnswer } from "@/server/agents/mentor";
import { recordActivity } from "@/server/services/activity";
import { AIBusyError, type ChatMessage } from "@/server/ai/groq";
import { enforceQuota, fail, handleError, readJSON, requireUser } from "@/server/http";

export const maxDuration = 60;

const bodySchema = z.object({ threadId: z.string().uuid().optional(), message: z.string().trim().min(1).max(4000) });

/** Streams NDJSON: {type:"meta"} → {type:"delta"}… → {type:"done"}. Saves both messages. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { supabase, user } = session;
    const parsed = bodySchema.safeParse(await readJSON(request));
    if (!parsed.success) return fail(400, "invalid", "Type a question first.");
    await enforceQuota(session, "mentor", 60);
    const { message } = parsed.data;

    let threadId = parsed.data.threadId;
    if (threadId) {
      const { data } = await supabase.from("mentor_threads").select("id").eq("id", threadId).eq("profile_id", user.id).maybeSingle();
      if (!data) return fail(404, "not_found", "Conversation not found.");
    } else {
      const title = message.length > 60 ? `${message.slice(0, 57).trim()}…` : message;
      const { data, error } = await supabase.from("mentor_threads").insert({ profile_id: user.id, title }).select("id").single();
      if (error) throw error;
      threadId = data.id;
    }

    const [{ data: profile }, { data: past }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("mentor_messages").select("role, content").eq("thread_id", threadId).order("created_at", { ascending: true }).limit(30),
    ]);
    await supabase.from("mentor_messages").insert({ thread_id: threadId, profile_id: user.id, role: "user", content: message });

    const history: ChatMessage[] = (past ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (e: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
        let full = "";
        try {
          const { stream: tokens, model, tools } = await mentorAnswer({ supabase, userId: user.id, profile: profile ?? {}, history, message });
          send({ type: "meta", threadId, model, tools });
          for await (const delta of tokens) { full += delta; send({ type: "delta", text: delta }); }
          await supabase.from("mentor_messages").insert({ thread_id: threadId, profile_id: user.id, role: "assistant", content: full || "…", meta: { model, tools } });
          await supabase.from("mentor_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
          await recordActivity(user.id, "mentor_question");
          send({ type: "done" });
        } catch (err) {
          send({ type: "error", message: err instanceof AIBusyError ? err.message : "The mentor couldn't answer right now. Please try again.", threadId });
          if (!(err instanceof AIBusyError)) console.error("[mentor]", err);
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error, "mentor:chat");
  }
}
