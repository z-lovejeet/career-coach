import "server-only";
import Groq, { APIError, toFile } from "groq-sdk";
import type { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming, ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { ZodType } from "zod";
import { env } from "@/server/env";
import { cacheGet, cacheKey, cacheSet } from "./cache";
import { cooldown, parseDuration, reserve, settle } from "./limiter";
import { estimateTokens, MODELS, SPEECH_MODELS, TIERS, type Tier } from "./models";

let client: Groq | null = null;
const groq = () => (client ??= new Groq({ apiKey: env.groqKey, maxRetries: 0, timeout: 60_000 }));

export type ChatMessage =
  | { role: "system" | "assistant"; content: string }
  | { role: "user"; content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> };

export interface Attempt { model: string; outcome: "ok" | "busy" | "rate_limited" | "error" | "invalid"; detail?: string }

export interface CallMeta {
  model: string;
  cached: boolean;
  ms: number;
  tokens: number;
  attempts: Attempt[];
}

export class AIBusyError extends Error {
  constructor(public retryAfter: number, public attempts: Attempt[]) {
    super(`All Groq models are at capacity. Try again in ${retryAfter}s.`);
  }
}

interface BaseOptions {
  tier: Tier;
  system: string;
  messages?: ChatMessage[];
  prompt?: string;
  images?: string[];          // data URLs, vision tier only
  maxTokens?: number;
  temperature?: number;
  cache?: { key: unknown[]; ttl: number; namespace: string };
}

function buildMessages(o: BaseOptions): ChatMessage[] {
  // House style for every model response: professional, no emoji.
  const messages: ChatMessage[] = [{ role: "system", content: `${o.system}\n\nStyle: write in a clear, professional tone. Never use emojis or decorative symbols, and never use HTML tags (such as <br>) in your output.` }];
  if (o.messages) messages.push(...o.messages);
  if (o.prompt !== undefined) {
    messages.push(o.images?.length
      ? { role: "user", content: [{ type: "text", text: o.prompt }, ...o.images.map((url) => ({ type: "image_url" as const, image_url: { url } }))] }
      : { role: "user", content: o.prompt });
  }
  return messages;
}

function promptTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, m) => {
    if (typeof m.content === "string") return sum + estimateTokens(m.content);
    return sum + m.content.reduce((s, part) => s + (part.type === "text" ? estimateTokens(part.text) : 1200), 0);
  }, 0) + 8 * messages.length;
}

/** How long to wait after a 429, from Groq's headers. */
function retryAfterSeconds(error: APIError): number {
  const h = error.headers;
  return parseDuration(h?.get("retry-after"))
    ?? parseDuration(h?.get("x-ratelimit-reset-tokens"))
    ?? parseDuration(h?.get("x-ratelimit-reset-requests"))
    ?? 20;
}

/**
 * Run a chat completion with caching, shared rate limiting and model fallback.
 * Tries each model in the tier's order; skips models that are out of budget or on cooldown.
 */
async function run<T>(o: BaseOptions, parse: (text: string) => T): Promise<{ data: T; meta: CallMeta }> {
  const started = Date.now();
  const key = o.cache ? cacheKey(o.cache.namespace, o.tier, o.system, o.prompt, o.messages, o.cache.key) : null;
  if (key) {
    const hit = await cacheGet<{ data: T; model: string }>(key);
    if (hit) return { data: hit.data, meta: { model: hit.model, cached: true, ms: Date.now() - started, tokens: 0, attempts: [] } };
  }

  const messages = buildMessages(o);
  const maxTokens = o.maxTokens ?? 1500;
  const estimate = promptTokens(messages) + Math.ceil(maxTokens * 0.7);
  const attempts: Attempt[] = [];
  let soonest = Infinity;

  for (const id of TIERS[o.tier]) {
    const spec = MODELS[id];
    if (o.images?.length && !spec.vision) continue;

    const wait = await reserve(id, estimate);
    if (wait > 0) {
      attempts.push({ model: id, outcome: "busy", detail: `retry in ${wait}s` });
      soonest = Math.min(soonest, wait);
      continue;
    }

    try {
      const completion = await groq().chat.completions.create({
        model: id,
        messages: messages as ChatCompletionMessageParam[],
        temperature: o.temperature ?? 0.5,
        max_completion_tokens: maxTokens,
        ...(parse !== identity ? { response_format: { type: "json_object" } } : {}),
        ...spec.params,
      } as ChatCompletionCreateParamsNonStreaming);

      const used = completion.usage?.total_tokens ?? estimate;
      void settle(id, used - estimate);
      const text = completion.choices[0]?.message?.content ?? "";

      let data: T;
      try {
        data = parse(text);
      } catch (error) {
        attempts.push({ model: id, outcome: "invalid", detail: (error as Error).message.slice(0, 160) });
        continue;
      }

      attempts.push({ model: id, outcome: "ok" });
      if (key && o.cache) void cacheSet(key, { data, model: id }, o.cache.ttl);
      return { data, meta: { model: id, cached: false, ms: Date.now() - started, tokens: used, attempts } };
    } catch (error) {
      void settle(id, -estimate);
      if (error instanceof APIError && error.status === 429) {
        const seconds = retryAfterSeconds(error);
        void cooldown(id, seconds, "429 from Groq");
        soonest = Math.min(soonest, seconds);
        attempts.push({ model: id, outcome: "rate_limited", detail: `cooldown ${Math.round(seconds)}s` });
      } else {
        attempts.push({ model: id, outcome: "error", detail: (error as Error).message?.slice(0, 160) });
      }
    }
  }

  if (attempts.every((a) => a.outcome === "busy" || a.outcome === "rate_limited")) {
    throw new AIBusyError(Number.isFinite(soonest) ? Math.ceil(soonest) : 30, attempts);
  }
  throw Object.assign(new Error("The AI models could not complete this request."), { attempts });
}

const identity = (text: string) => text;

/** Plain-text completion. */
export function completeText(o: BaseOptions) {
  return run(o, identity);
}

/** JSON completion validated against a zod schema. Invalid output falls through to the next model. */
export function completeJSON<T>(o: BaseOptions & { schema: ZodType<T> }) {
  // Groq's JSON mode requires the word "json" in the messages.
  const options = { ...o, system: `${o.system}\n\nRespond with a single valid JSON object only.` };
  return run(options, (text) => {
    const parsed = o.schema.safeParse(parseJSON(text));
    if (!parsed.success) throw new Error(`schema: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    return parsed.data;
  });
}

/** Tolerant JSON parse (strips code fences / leading prose). */
export function parseJSON(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[[{]/);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("response was not JSON");
  }
}

/**
 * Streaming text completion with the same limiter + fallback.
 * Fallback happens only before the first token arrives.
 */
export async function streamText(o: BaseOptions): Promise<{ model: string; stream: AsyncGenerator<string> }> {
  const messages = buildMessages(o);
  const maxTokens = o.maxTokens ?? 1200;
  const estimate = promptTokens(messages) + Math.ceil(maxTokens * 0.6);
  const attempts: Attempt[] = [];
  let soonest = Infinity;

  for (const id of TIERS[o.tier]) {
    const wait = await reserve(id, estimate);
    if (wait > 0) { attempts.push({ model: id, outcome: "busy" }); soonest = Math.min(soonest, wait); continue; }
    try {
      const response = await groq().chat.completions.create({
        model: id,
        messages: messages as ChatCompletionMessageParam[],
        temperature: o.temperature ?? 0.6,
        max_completion_tokens: maxTokens,
        stream: true,
        ...MODELS[id].params,
      } as ChatCompletionCreateParamsStreaming);

      async function* tokens() {
        let used = 0;
        for await (const chunk of response) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) yield delta;
          used = chunk.x_groq?.usage?.total_tokens ?? used;
        }
        void settle(id, (used || estimate) - estimate);
      }
      return { model: id, stream: tokens() };
    } catch (error) {
      void settle(id, -estimate);
      if (error instanceof APIError && error.status === 429) {
        const seconds = retryAfterSeconds(error);
        void cooldown(id, seconds, "429 from Groq");
        soonest = Math.min(soonest, seconds);
        attempts.push({ model: id, outcome: "rate_limited" });
      } else {
        attempts.push({ model: id, outcome: "error", detail: (error as Error).message });
      }
    }
  }
  throw new AIBusyError(Number.isFinite(soonest) ? Math.ceil(soonest) : 30, attempts);
}

/** Speech-to-text with Whisper fallback. */
export async function transcribe(audio: Blob, filename = "answer.webm"): Promise<string> {
  let lastError: unknown;
  for (const model of SPEECH_MODELS) {
    if ((await reserve(model, 0)) > 0) continue;
    try {
      const file = await toFile(audio, filename);
      const result = await groq().audio.transcriptions.create({ file, model, language: "en", temperature: 0 });
      return result.text.trim();
    } catch (error) {
      lastError = error;
      if (error instanceof APIError && error.status === 429) void cooldown(model, retryAfterSeconds(error), "429 from Groq");
    }
  }
  throw lastError ?? new AIBusyError(30, []);
}
