import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Cpu } from "lucide-react";
import { createClient } from "@/server/db/supabase";
import { Brand } from "@/components/brand";
import { Badge, buttonClass } from "@/components/ui/primitives";
import type { RoadmapGraph, TraceStep } from "@/lib/types";

export const metadata: Metadata = { title: "Sample roadmaps", description: "Three roadmaps generated end-to-end by the CareerCompass agent." };
export const dynamic = "force-dynamic";

export default async function SamplesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("roadmaps").select("id, title, target, graph, trace, sample_persona, created_at")
    .eq("is_sample", true).eq("status", "active").order("created_at", { ascending: true });
  const samples = data ?? [];

  return (
    <div className="paper-grain min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <Link href="/login" className={buttonClass("outline", "sm")}>Sign in</Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <p className="eyebrow">Deliverable · agent output</p>
        <h1 className="display mt-3 max-w-3xl text-[42px] leading-[1.08] text-ink sm:text-[54px]">Three students, three routes <em className="text-accent">from courses to careers.</em></h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">Each roadmap below was produced end-to-end by the CareerCompass agent from a short student profile: Profile Analyst → Career Matcher (ML on O*NET) → Navigator → Gap Analyzer → Curriculum Planner → Roadmap Composer → Critic. Open one to see the map, the timeline and the full agent trace.</p>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {samples.map((s, i) => {
            const g = s.graph as RoadmapGraph;
            const trace = s.trace as TraceStep[];
            const courses = g.nodes.filter((n) => n.kind === "course").length;
            const skills = g.nodes.filter((n) => n.kind === "skill").length;
            const projects = g.nodes.filter((n) => n.kind === "project").length;
            const models = [...new Set(trace.map((t) => t.model).filter(Boolean))] as string[];
            return (
              <Link key={s.id} href={`/samples/${s.id}`} className="card group flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-float">
                <div className="flex items-center justify-between"><span className="num text-xs text-faint">0{i + 1}</span><ArrowUpRight className="size-4 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" /></div>
                <p className="mt-5 text-[13px] font-medium text-ink-2">{s.sample_persona?.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.sample_persona?.background}</p>
                <div className="my-5 h-px bg-line" />
                <p className="text-xs text-muted">Destination</p>
                <p className="display mt-1 text-[24px] leading-tight text-ink">{s.target.title}</p>
                <p className="text-xs text-muted">{s.target.family} · O*NET {s.target.code}</p>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  {[["Courses", courses], ["Skills", skills], ["Projects", projects], ["Weeks", g.totalWeeks]].map(([label, n]) => (
                    <div key={label as string} className="rounded-[10px] bg-surface-2 py-2.5 ring-1 ring-line"><p className="num text-lg text-ink">{n}</p><p className="text-[10px] text-muted">{label}</p></div>
                  ))}
                </div>
                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap gap-1.5">{models.map((m) => <Badge key={m} tone="outline"><Cpu /> {m.replace("openai/", "")}</Badge>)}</div>
                </div>
              </Link>
            );
          })}
        </div>
        {!samples.length && <p className="mt-10 text-muted">Samples are being generated.</p>}
        <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <Link href="/login?mode=signup" className={buttonClass("primary", "lg")}>Make my own roadmap <ArrowRight /></Link>
          <p className="text-sm text-muted">Career data: O*NET 31.0 Database (U.S. Department of Labor), CC BY 4.0.</p>
        </div>
      </main>
    </div>
  );
}
