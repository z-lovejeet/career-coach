import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenCheck, Check, Flame, Mic, Route, Sparkles, Target, Trophy } from "lucide-react";
import { getSession } from "@/server/db/supabase";
import { loadProgress } from "@/server/services/progress";
import { career } from "@/server/onet/catalogue";
import { Badge, buttonClass, Card, CardHeader, Progress } from "@/components/ui/primitives";
import { Gauge, Heatmap, Meter } from "@/components/ui/charts";
import { CompanyPanel } from "@/components/dashboard/company-panel";
import { isWork } from "@/lib/roadmap-ops";
import type { CareerMatch, FamilyFit } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const { supabase, user } = (await getSession())!;
  const [progress, { data: profile }] = await Promise.all([
    loadProgress(supabase, user.id),
    supabase.from("profiles").select("full_name, analysis, goals").eq("id", user.id).single(),
  ]);
  const first = (profile?.full_name ?? "").split(" ")[0] || "there";
  const matches = (progress.matches?.matches ?? []) as CareerMatch[];
  const families = (progress.matches?.families ?? []) as FamilyFit[];
  const target = progress.readiness.targetCode ? career(progress.readiness.targetCode) : null;
  const graph = progress.roadmap?.graph;
  const nextSteps = graph?.nodes.filter((n) => isWork(n) && n.status !== "done").sort((a, b) => (a.status === "doing" ? -1 : 0) - (b.status === "doing" ? -1 : 0)).slice(0, 3) ?? [];
  const weakest = progress.practice.topics.find((t) => t.total >= 3 && t.accuracy < 70);

  const actions = [
    ...nextSteps.slice(0, 2).map((n) => ({ icon: Route, title: n.title, detail: `${n.status === "doing" ? "In progress" : "Next on your roadmap"} · ${n.weeks}w`, href: `/roadmap/${progress.roadmap!.id}` })),
    weakest
      ? { icon: BookOpenCheck, title: `Practise ${weakest.topic}`, detail: `${weakest.accuracy}% accuracy so far — your weakest topic`, href: `/practice?subject=${encodeURIComponent(weakest.subject)}&topic=${encodeURIComponent(weakest.topic)}` }
      : { icon: BookOpenCheck, title: "Start a practice session", detail: "10 timed questions with explanations", href: "/practice" },
    progress.interviews.completed === 0
      ? { icon: Mic, title: "Take your first mock interview", detail: target ? `Practise for ${target.title}` : "Technical or HR, voice or text", href: "/interview" }
      : { icon: Mic, title: "Another mock interview", detail: `Average so far ${progress.interviews.average}/100`, href: "/interview" },
  ];
  if (!progress.roadmap) actions.unshift({ icon: Sparkles, title: "Generate your roadmap", detail: "Courses → skills → career, planned by the agent", href: "/roadmap" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="eyebrow mb-2">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
          <h1 className="display text-[36px] leading-tight text-ink sm:text-[42px]">{greeting()}, {first}.</h1>
          <p className="mt-1.5 text-[15px] text-muted">{target ? <>Working towards <span className="text-ink">{target.title}</span>.</> : "Let's find your direction."}</p>
        </div>
        {progress.roadmap
          ? <Link href={`/roadmap/${progress.roadmap.id}`} className={buttonClass("primary", "md")}>Continue roadmap <ArrowRight /></Link>
          : <Link href="/roadmap" className={buttonClass("primary", "md")}><Sparkles /> Build my roadmap</Link>}
      </header>

      {/* Row 1 — readiness · next actions · momentum */}
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-[1.2fr_1fr_0.85fr]">
        <Card className="p-6">
          <CardHeader title="Readiness" description={target ? `For ${target.title} · O*NET ${progress.readiness.targetCode}` : "Analyse your profile to see this"} />
          <div className="mt-5 flex flex-col items-center gap-7 sm:flex-row sm:items-center">
            <Gauge value={progress.readiness.score} label="out of 100" />
            <div className="w-full flex-1 space-y-3.5">
              {progress.readiness.parts.map((p) => (
                <Meter key={p.key} label={p.label} value={p.value ?? 0} detail={p.value === null ? "not started" : `${p.value}%`} tone={p.value === null ? "muted" : "accent"} />
              ))}
            </div>
          </div>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">Calculated, not guessed — 55% O*NET requirement coverage (rises as you finish roadmap steps), 15% practice accuracy, 15% interview scores, 15% roadmap completion.</p>
        </Card>

        <Card className="p-6">
          <CardHeader title="Up next" description="Picked from your roadmap and practice results" />
          <ul className="mt-4 space-y-1">
            {actions.slice(0, 4).map((a, i) => (
              <li key={i}>
                <Link href={a.href} className="group flex items-center gap-3.5 rounded-[11px] px-2 py-3 transition-colors hover:bg-surface-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-ink-2 group-hover:border-accent-line group-hover:text-accent"><a.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-ink">{a.title}</span><span className="block truncate text-xs text-muted">{a.detail}</span></span>
                  <ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 lg:col-span-2 2xl:col-span-1">
          <CardHeader title="Momentum" />
          <div className="mt-4 grid gap-5 sm:grid-cols-2 2xl:grid-cols-1">
            <div className="flex items-center gap-3">
              <span className={cn("grid size-11 place-items-center rounded-full", progress.streak.current ? "bg-warm-soft text-warm" : "bg-sunken text-faint")}><Flame className="size-5" /></span>
              <div><p className="whitespace-nowrap"><span className="num text-2xl text-ink">{progress.streak.current}</span><span className="ml-1.5 text-sm text-muted">day streak</span></p><p className="text-xs text-muted">Best {progress.streak.best}</p></div>
            </div>
            <div>
              <div className="flex items-baseline justify-between"><p className="text-sm text-ink-2">Level <span className="num text-xl text-ink">{progress.xp.level}</span></p><p className="num text-xs text-muted">{progress.xp.total} XP</p></div>
              <Progress value={progress.xp.progress * 100} tone="warm" className="mt-2" />
              <p className="mt-1.5 text-xs text-muted">{progress.xp.next - progress.xp.total} XP to level {progress.xp.level + 1} · +{progress.xp.week} this week</p>
            </div>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-4 sm:grid-cols-3 2xl:grid-cols-2">
            {progress.milestones.map((m) => (
              <li key={m.id} className={cn("flex items-center gap-1.5 text-xs", m.done ? "text-ink-2" : "text-faint")}>
                {m.done ? <Check className="size-3.5 text-success" /> : <Trophy className="size-3.5" />}{m.label}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Row 2 — career matches · companies */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card className="p-6">
          <CardHeader title="Careers that fit you" description="Career matcher trained on 910 O*NET occupations" action={<Badge tone="warm">ML model</Badge>} />
          {matches.length ? (
            <>
              <ol className="mt-4 divide-y divide-line">
                {matches.slice(0, 6).map((m, i) => (
                  <li key={m.code} className="flex items-center gap-4 py-3">
                    <span className="num w-4 text-xs text-faint">{i + 1}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-medium text-ink">{m.title}</p><p className="truncate text-xs text-muted">{m.family} · job zone {m.jobZone}</p></div>
                    <div className="hidden w-24 sm:block"><Progress value={m.match} /></div>
                    <span className="num w-9 text-right text-sm text-ink">{m.match}%</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2.5 text-xs font-medium text-muted">Career family fit (logistic regression)</p>
                <div className="flex h-2 overflow-hidden rounded-full bg-sunken">
                  {families.slice(0, 4).map((f, i) => <div key={f.code} style={{ width: `${f.probability * 100}%`, opacity: 1 - i * 0.22 }} className="bg-accent" title={`${f.name} ${Math.round(f.probability * 100)}%`} />)}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">{families.slice(0, 3).map((f) => <span key={f.code}>{f.name} <span className="num text-ink-2">{Math.round(f.probability * 100)}%</span></span>)}</div>
              </div>
            </>
          ) : <p className="mt-6 text-sm text-muted">Complete your profile analysis to see matches.</p>}
        </Card>
        <CompanyPanel />
      </div>

      {/* Row 3 — roadmap · practice · interviews */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <CardHeader title="Roadmap" action={progress.roadmap && <Link href={`/roadmap/${progress.roadmap.id}`} className="text-xs text-accent hover:underline">Open</Link>} />
          {graph ? (
            <>
              <p className="mt-1 text-[13px] text-muted">{progress.roadmap!.title}</p>
              <div className="mt-4 flex items-center gap-3"><Progress value={progress.roadmap!.progress} /><span className="num text-sm text-ink">{progress.roadmap!.progress}%</span></div>
              <ul className="mt-5 space-y-3">
                {graph.phases.map((p) => {
                  const items = graph.nodes.filter((n) => n.phaseId === p.id && isWork(n));
                  const done = items.filter((n) => n.status === "done").length;
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className={cn("grid size-5 place-items-center rounded-full border text-[10px]", done === items.length && items.length ? "border-success bg-success text-white" : "border-line-strong text-faint")}>{done === items.length && items.length ? <Check className="size-3" /> : null}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{p.title}</span>
                      <span className="num text-xs text-muted">{done}/{items.length}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : <div className="mt-6"><Link href="/roadmap" className={buttonClass("secondary", "sm")}><Sparkles /> Generate roadmap</Link></div>}
        </Card>

        <Card className="p-6">
          <CardHeader title="Practice" action={<Link href="/practice" className="text-xs text-accent hover:underline">Practise</Link>} />
          {progress.practice.answered ? (
            <>
              <div className="mt-2 flex items-baseline gap-2"><span className="num text-3xl text-ink">{progress.practice.accuracy}%</span><span className="text-xs text-muted">accuracy · {pluralize(progress.practice.answered, "question")}</span></div>
              <div className="mt-5 space-y-3">
                {progress.practice.topics.slice(0, 5).map((t) => <Meter key={`${t.subject}${t.topic}`} label={t.topic} value={t.accuracy} tone={t.accuracy < 60 ? "warm" : "accent"} />)}
              </div>
            </>
          ) : <p className="mt-4 text-sm leading-relaxed text-muted">No practice yet. Topic accuracy will appear here — your weakest topics feed your next actions.</p>}
        </Card>

        <Card className="p-6">
          <CardHeader title="Interviews" action={<Link href="/interview" className="text-xs text-accent hover:underline">New</Link>} />
          {progress.interviews.recent.length ? (
            <ul className="mt-3 divide-y divide-line">
              {progress.interviews.recent.map((iv) => (
                <li key={iv.id}>
                  <Link href={`/interview/${iv.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                    <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-ink">{iv.config?.company} · {iv.config?.role}</span><span className="block text-xs text-muted">{iv.config?.difficulty} · {iv.status}</span></span>
                    {typeof iv.score === "number" ? <span className="num text-sm text-ink">{iv.score}</span> : <ArrowUpRight className="size-4 text-faint" />}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm leading-relaxed text-muted">Practise with an AI interviewer that adapts to your answers and scores you like a real panel.</p>}
        </Card>
      </div>

      {/* Row 4 — activity */}
      <Card className="p-6">
        <CardHeader title="Activity" description="Last 18 weeks — roadmap steps, practice, interviews and mentor sessions" action={<span className="num text-xs text-muted">{progress.heatmap.reduce((s, d) => s + d.count, 0)} activities</span>} />
        <Heatmap days={progress.heatmap} className="mt-5" />
        {profile?.analysis?.summary && (
          <div className="mt-6 grid gap-6 border-t border-line pt-5 md:grid-cols-[1fr_auto]">
            <p className="text-sm leading-relaxed text-ink-2"><Target className="mr-1.5 inline size-4 text-accent" />{profile.analysis.summary}</p>
            <Link href="/profile" className="text-sm text-accent hover:underline">Update profile</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
