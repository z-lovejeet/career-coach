import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { AIBusyError } from "@/server/ai/groq";
import { getSession, type Session } from "@/server/db/supabase";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: { code, message, ...extra } }, { status });
}

/** Map thrown errors to clean JSON responses. */
export function handleError(error: unknown, context: string) {
  if (error instanceof AIBusyError) {
    return fail(429, "ai_busy", `The AI is at its free-tier limit. Try again in about ${error.retryAfter}s.`, { retryAfter: error.retryAfter });
  }
  if (error instanceof HttpError) return fail(error.status, error.code, error.message);
  console.error(`[${context}]`, error);
  return fail(500, "server_error", "Something went wrong. Please try again.");
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Require a signed-in user or throw a 401. */
export async function requireUser(): Promise<Session & { user: User }> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "unauthorized", "Please sign in.");
  return session;
}

/** Per-user hourly quota for AI actions. Fails closed. */
export async function enforceQuota(session: Session, action: string, perHour: number) {
  const { data, error } = await session.supabase.rpc("cc_consume_quota", { p_action: action, p_limit: perHour });
  if (error) throw new HttpError(503, "quota_unavailable", "Usage limits are temporarily unavailable.");
  if (typeof data === "number" && data > 0) {
    throw new HttpError(429, "rate_limited", `You've reached the hourly limit for this action. Try again in ${Math.ceil(data / 60)} min.`);
  }
}

export async function readJSON<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be JSON.");
  }
}
