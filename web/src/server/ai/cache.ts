import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "@/server/db/supabase";

/** Stable cache key from any JSON-serialisable parts. */
export function cacheKey(namespace: string, ...parts: unknown[]): string {
  const digest = createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 40);
  return `${namespace}:${digest}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const { data, error } = await adminClient().rpc("cc_cache_get", { p_key: key });
  if (error) {
    console.warn("[cache] get failed:", error.message);
    return null;
  }
  return (data as T) ?? null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  const { error } = await adminClient().rpc("cc_cache_set", {
    p_key: key,
    p_value: value,
    p_ttl_seconds: Math.round(ttlSeconds),
  });
  if (error) console.warn("[cache] set failed:", error.message);
}

export const TTL = {
  hour: 3600,
  day: 86_400,
  week: 604_800,
  month: 2_592_000,
} as const;
