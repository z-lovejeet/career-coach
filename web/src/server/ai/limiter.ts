import "server-only";
import { adminClient } from "@/server/db/supabase";
import { LIMITS } from "./models";

/**
 * Shared, cross-instance rate limiter backed by Postgres (see cc_groq_* functions).
 * Serverless instances don't share memory, so the counters live in the database.
 */

/** Reserve capacity. Returns 0 if allowed, otherwise seconds until the model frees up. */
export async function reserve(model: string, tokens: number): Promise<number> {
  const { data, error } = await adminClient().rpc("cc_groq_reserve", {
    p_model: model,
    p_tokens: tokens,
    p_rpm: LIMITS.rpm,
    p_rpd: LIMITS.rpd,
    p_tpm: LIMITS.tpm,
    p_tpd: LIMITS.tpd,
  });
  if (error) {
    // The limiter is an optimisation; Groq still enforces its own limits (handled as 429s).
    console.warn("[limiter] reserve failed:", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

/** Correct the reserved estimate with the real token count. */
export async function settle(model: string, delta: number) {
  if (!delta) return;
  const { error } = await adminClient().rpc("cc_groq_settle", { p_model: model, p_delta: Math.round(delta) });
  if (error) console.warn("[limiter] settle failed:", error.message);
}

/** Put a model on cooldown after Groq rejects it (429) so other requests skip it. */
export async function cooldown(model: string, seconds: number, reason: string) {
  const { error } = await adminClient().rpc("cc_groq_cooldown", {
    p_model: model,
    p_seconds: Math.max(1, Math.ceil(seconds)),
    p_reason: reason.slice(0, 200),
  });
  if (error) console.warn("[limiter] cooldown failed:", error.message);
}

export async function usageStatus(): Promise<Record<string, unknown>> {
  const { data } = await adminClient().rpc("cc_groq_status");
  return (data as Record<string, unknown>) ?? {};
}

/** Parse Groq durations like "1m26.4s", "577ms", "7.66s" into seconds. */
export function parseDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  if (/^\d+(\.\d+)?$/.test(value)) return Number(value);
  let total = 0;
  for (const [, amount, unit] of value.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    const n = Number(amount);
    total += unit === "h" ? n * 3600 : unit === "m" ? n * 60 : unit === "s" ? n : n / 1000;
  }
  return total || null;
}
