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
    </>
  );
}
