import "server-only";
import { adminClient } from "@/server/db/supabase";

/** XP awarded per action. Light-touch: enough to show momentum, not a game. */
export const XP = {
  profile_completed: 50,
  roadmap_generated: 40,
  roadmap_step_done: 15,
  practice_correct: 4,
  practice_completed: 20,
  interview_completed: 60,
  mentor_question: 2,
} as const;

export type ActivityKind = keyof typeof XP;

/** Written with the service role so XP can't be forged from the browser. */
export async function recordActivity(profileId: string, kind: ActivityKind, meta: Record<string, unknown> = {}, multiplier = 1) {
  const { error } = await adminClient().from("activity").insert({
    profile_id: profileId,
    kind,
    xp: Math.round(XP[kind] * multiplier),
    meta,
  });
  if (error) console.warn("[activity] insert failed:", error.message);
}

export function levelFor(xp: number) {
  // Level n needs 60·n·(n−1)/2 XP: 0, 60, 180, 360, 600, …
  let level = 1;
  while (60 * ((level * (level + 1)) / 2) <= xp) level++;
  const floor = 60 * (((level - 1) * level) / 2);
  const next = 60 * ((level * (level + 1)) / 2);
  return { level, floor, next, progress: (xp - floor) / (next - floor) };
}
