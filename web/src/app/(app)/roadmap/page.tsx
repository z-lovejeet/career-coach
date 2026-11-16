import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Route } from "lucide-react";
import { getSession } from "@/server/db/supabase";
import { PageHeader, Progress } from "@/components/ui/primitives";
import { RoadmapGenerator } from "@/components/roadmap/generator";
import { roadmapProgress } from "@/lib/roadmap-ops";
import type { CareerMatch, RoadmapGraph } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapsPage() {
  const session = (await getSession())!;
  const { supabase, user } = session;
  const [{ data: roadmaps }, { data: matches }, { data: profile }] = await Promise.all([
    supabase.from("roadmaps").select("id, title, target, graph, updated_at, version").eq("profile_id", user.id).eq("status", "active").order("updated_at", { ascending: false }),
    supabase.from("career_matches").select("matches").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("profiles").select("goals").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Roadmap"
        title={roadmaps?.length ? "Your roadmaps" : "Plan your route"}
        description="Pick a destination career. The agent analyses your gaps against O*NET, chooses courses and projects, and sequences them into phases you can edit."
      />
      {!!roadmaps?.length && (
        <section className="mb-10 grid gap-4 md:grid-cols-2">
          {roadmaps.map((r) => {
            const p = roadmapProgress(r.graph as RoadmapGraph);
            return (
              <Link key={r.id} href={`/roadmap/${r.id}`} className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-float">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent"><Route className="size-4" /></span>
                  <ArrowUpRight className="size-4 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <p className="mt-4 text-[17px] font-semibold text-ink">{r.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{r.target.family} · {(r.graph as RoadmapGraph).totalWeeks} weeks · updated {timeAgo(r.updated_at)}</p>
                <div className="mt-5 flex items-center gap-3"><Progress value={p.percent} /><span className="num text-xs text-ink-2">{p.percent}%</span></div>
              </Link>
            );
          })}
        </section>
      )}
      {!!roadmaps?.length && <h2 className="mb-4 text-[15px] font-semibold text-ink">Plan another route</h2>}
      <RoadmapGenerator matches={(matches?.matches ?? []) as CareerMatch[]} defaults={{ hoursPerWeek: profile?.goals?.hoursPerWeek ?? 10, timelineMonths: profile?.goals?.timelineMonths ?? 6 }} />

      <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-6">
          <p className="text-[15px] font-semibold text-ink">How your roadmap is built</p>
          <p className="mt-0.5 text-[13px] text-muted">Seven steps run in order. You&apos;ll see each one complete live, and the full trace is saved with the roadmap.</p>
          <ol className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ["Profile Analyst", "Rates you on 68 O*NET skill and knowledge descriptors."],
              ["Career Matcher", "Scores 910 occupations with the trained model."],
              ["Navigator", "Settles on the destination career you chose or fit best."],
              ["Gap Analyzer", "Compares your level with what the role requires."],
              ["Curriculum Planner", "Picks subjects, courses and projects for each gap."],
              ["Roadmap Composer", "Orders them into phases with milestones."],
              ["Critic", "Checks coverage and timeline, and repairs gaps."],
            ].map(([name, body], i) => (
              <li key={name} className="flex gap-3">
                <span className="num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-[11px] text-ink-2">{i + 1}</span>
                <span><span className="block text-[14px] font-medium text-ink">{name}</span><span className="block text-[13px] leading-relaxed text-muted">{body}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <div className="card p-6">
          <p className="text-[15px] font-semibold text-ink">Getting the most out of it</p>
          <ul className="mt-4 space-y-4 text-[13.5px] leading-relaxed text-ink-2">
            <li><span className="font-medium text-ink">Be honest about time.</span> A plan at 8 hours a week that you follow beats one at 25 that you abandon in week two.</li>
            <li><span className="font-medium text-ink">Use the request box.</span> Tell the planner what you already know or prefer — free resources, GATE alongside placements, more projects.</li>
            <li><span className="font-medium text-ink">Keep it alive.</span> Tick off steps as you go: your readiness score rises, and “Suggest improvements” uses your practice results to adjust the plan.</li>
            <li><span className="font-medium text-ink">Try more than one route.</span> Generate roadmaps for two careers you&apos;re torn between and compare the gaps.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
