import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyseGaps, coverage } from "@/server/agents/roadmap/gaps";
import { levelFor } from "./activity";
import type { RoadmapGraph } from "@/lib/types";

const TZ = "Asia/Kolkata";
const dayKey = (d: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));

/**
 * Effective O*NET vector: the analyst's ratings plus evidence from completed roadmap steps
 * (each finished course/project adds +0.12 to the skills it builds, capped at 1).
 */
export function effectiveVector(vector: Record<string, number>, graph?: RoadmapGraph | null) {
  const out = { ...vector };
  for (const n of graph?.nodes ?? []) {
    if (n.status !== "done" || (n.kind !== "course" && n.kind !== "project")) continue;
    for (const id of n.skillIds ?? []) if (id.includes(":")) out[id] = Math.min(1, (out[id] ?? 0) + 0.12);
  }
  return out;
}

export async function loadProgress(supabase: SupabaseClient, profileId: string) {
  const since = new Date(Date.now() - 126 * 86_400_000).toISOString();
  const [activity, xpAll, sessions, interviews, roadmap, profile, matches] = await Promise.all([
    supabase.from("activity").select("kind, xp, created_at").eq("profile_id", profileId).gte("created_at", since).order("created_at", { ascending: false }).limit(2000),
    supabase.from("activity").select("xp").eq("profile_id", profileId).limit(10000),
    supabase.from("practice_sessions").select("subject, topic, correct, total, responses, status, completed_at, started_at").eq("profile_id", profileId).order("started_at", { ascending: false }).limit(200),
    supabase.from("interviews").select("id, config, score, status, created_at, completed_at").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(50),
    supabase.from("roadmaps").select("id, title, target, graph, updated_at").eq("profile_id", profileId).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("profiles").select("onet_vector").eq("id", profileId).maybeSingle(),
    supabase.from("career_matches").select("matches, families, created_at").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // XP, level, streak, heatmap
  const totalXp = (xpAll.data ?? []).reduce((s, r) => s + (r.xp ?? 0), 0);
  const level = levelFor(totalXp);
  const perDay = new Map<string, number>();
  for (const a of activity.data ?? []) perDay.set(dayKey(a.created_at), (perDay.get(dayKey(a.created_at)) ?? 0) + 1);
  const today = dayKey(new Date());
  const heatmap = Array.from({ length: 126 }, (_, i) => {
    const date = dayKey(new Date(Date.now() - (125 - i) * 86_400_000));
    return { date, count: perDay.get(date) ?? 0 };
  });
  let streak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].count > 0) streak++;
    else if (heatmap[i].date === today) continue; // today not done yet doesn't break the streak
    else break;
  }
  let best = 0, run = 0;
  for (const d of heatmap) { run = d.count ? run + 1 : 0; best = Math.max(best, run); }
  const weekXp = (activity.data ?? []).filter((a) => Date.now() - new Date(a.created_at).getTime() < 7 * 86_400_000).reduce((s, a) => s + a.xp, 0);

  // Practice
  const done = (sessions.data ?? []).filter((s) => s.status === "completed");
  const topics = new Map<string, { subject: string; topic: string; correct: number; total: number }>();
  for (const s of done) {
    const key = `${s.subject}::${s.topic}`;
    const t = topics.get(key) ?? { subject: s.subject, topic: s.topic, correct: 0, total: 0 };
    t.correct += s.correct;
    t.total += s.total;
    topics.set(key, t);
  }
  const topicStats = [...topics.values()].map((t) => ({ ...t, accuracy: Math.round((t.correct / Math.max(1, t.total)) * 100) }));
  const answered = topicStats.reduce((s, t) => s + t.total, 0);
  const practiceAccuracy = answered ? Math.round((topicStats.reduce((s, t) => s + t.correct, 0) / answered) * 100) : null;

  // Interviews
  const completedInterviews = (interviews.data ?? []).filter((i) => i.status === "completed" && typeof i.score === "number");
  const interviewAvg = completedInterviews.length ? Math.round(completedInterviews.slice(0, 5).reduce((s, i) => s + i.score!, 0) / Math.min(5, completedInterviews.length)) : null;

  // Roadmap
  const graph = roadmap.data?.graph as RoadmapGraph | undefined;
  const work = graph?.nodes.filter((n) => n.kind === "course" || n.kind === "project") ?? [];
  const weeksTotal = work.reduce((s, n) => s + n.weeks, 0);
  const weeksDone = work.filter((n) => n.status === "done").reduce((s, n) => s + n.weeks, 0);
  const roadmapProgress = weeksTotal ? Math.round((weeksDone / weeksTotal) * 100) : null;

  // Readiness (algorithmic, explainable)
  const vector = profile.data?.onet_vector as Record<string, number> | null;
  const targetCode = roadmap.data?.target?.code ?? matches.data?.matches?.[0]?.code ?? null;
  let skillCoverage: number | null = null;
  let gaps: ReturnType<typeof analyseGaps>["gaps"] = [];
  if (vector && targetCode) {
    const analysed = analyseGaps(targetCode, effectiveVector(vector, graph));
    gaps = analysed.gaps;
    skillCoverage = coverage(gaps);
  }
  const parts = [
    { key: "skills", label: "Skill coverage (O*NET)", weight: 0.55, value: skillCoverage },
    { key: "practice", label: "Practice accuracy", weight: 0.15, value: practiceAccuracy },
    { key: "interviews", label: "Interview performance", weight: 0.15, value: interviewAvg },
    { key: "roadmap", label: "Roadmap completed", weight: 0.15, value: roadmapProgress },
  ];
  const readiness = Math.round(parts.reduce((s, p) => s + p.weight * (p.value ?? 0), 0));

  const milestones = [
    { id: "profile", label: "Profile analysed", done: !!vector },
    { id: "roadmap", label: "First roadmap", done: !!graph },
    { id: "practice10", label: "50 questions practised", done: answered >= 50 },
    { id: "interview", label: "First mock interview", done: completedInterviews.length > 0 },
    { id: "streak7", label: "7-day streak", done: best >= 7 },
    { id: "half", label: "Roadmap half done", done: (roadmapProgress ?? 0) >= 50 },
  ];

  return {
    xp: { total: totalXp, week: weekXp, ...level },
    streak: { current: streak, best },
    heatmap,
    practice: { accuracy: practiceAccuracy, answered, sessions: done.length, topics: topicStats.sort((a, b) => a.accuracy - b.accuracy) },
    interviews: { average: interviewAvg, completed: completedInterviews.length, recent: (interviews.data ?? []).slice(0, 4) },
    roadmap: roadmap.data ? { id: roadmap.data.id, title: roadmap.data.title, target: roadmap.data.target, progress: roadmapProgress ?? 0, graph } : null,
    readiness: { score: readiness, parts, targetCode, gaps: gaps.slice(0, 6) },
    matches: matches.data ?? null,
    milestones,
  };
}

export type Progress = Awaited<ReturnType<typeof loadProgress>>;

/** Short text summary of the student's progress, for agent prompts. */
export async function progressContext(supabase: SupabaseClient, profileId: string): Promise<string> {
  const p = await loadProgress(supabase, profileId);
  const weak = p.practice.topics.filter((t) => t.total >= 3).slice(0, 4).map((t) => `${t.topic} (${t.subject}) ${t.accuracy}%`);
  const strong = [...p.practice.topics].reverse().filter((t) => t.total >= 3 && t.accuracy >= 75).slice(0, 3).map((t) => t.topic);
  return [
    `Readiness ${p.readiness.score}/100 (skill coverage ${p.readiness.parts[0].value ?? "n/a"}%).`,
    p.roadmap ? `Roadmap "${p.roadmap.title}" ${p.roadmap.progress}% done.` : "No roadmap yet.",
    p.practice.answered ? `Practice: ${p.practice.answered} questions, ${p.practice.accuracy}% accuracy. Weak: ${weak.join(", ") || "none"}. Strong: ${strong.join(", ") || "none"}.` : "No practice yet.",
    p.interviews.completed ? `Mock interviews: ${p.interviews.completed}, average ${p.interviews.average}/100.` : "No mock interviews yet.",
    p.readiness.gaps.length ? `Biggest O*NET gaps: ${p.readiness.gaps.slice(0, 4).map((g) => g.name).join(", ")}.` : "",
    `Streak ${p.streak.current} days, level ${p.xp.level}.`,
  ].filter(Boolean).join("\n");
}
