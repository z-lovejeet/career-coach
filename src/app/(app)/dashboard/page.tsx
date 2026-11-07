"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowRight, ArrowUpRight, Building2, CheckCircle2, ClipboardList, Flame, Map, Mic, Sparkles, Target, User, X } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ReadinessLens } from "@/components/studio/readiness-lens";
import { ActivityBars, type ProgressOverview } from "@/components/workspace/activity";
import { request } from "@/components/workspace/api";
import { ActionLink, clampPercent, ErrorNotice, IconTile, Notice, Panel, PanelHeading, PercentBar, prettyLabel, Tag, WorkspaceHeading, WorkspaceSkeleton } from "@/components/workspace/ui";
import type { Analysis, CompanyRecommendation, Task } from "@/types";

interface DashboardData {
  profile: { full_name: string | null; onboarding_complete: boolean; skills?: string[]; goals?: string[] } | null;
  analysis: Analysis | null;
  tasks: Task[];
  taskStats?: { total: number; completed: number };
  recommendations: CompanyRecommendation | null;
  streakInfo: { streak: { current: number }; xp: { level: number; total: number } } | null;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  action?: { label: string; href: string };
}

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", request<DashboardData>);
  const { data: alertData } = useSWR("/api/alerts/check", request<{ alerts: Alert[] }>, { shouldRetryOnError: false });
  const { data: progress, error: progressError, isLoading: loadingProgress, mutate: refreshProgress } = useSWR("/api/streak", request<ProgressOverview>);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  if (isLoading) return <WorkspaceSkeleton />;
  if (!data) return <div className="workspace-page"><ErrorNotice error={error} retry={() => void mutate()} /></div>;

  const { profile, analysis, tasks, recommendations, streakInfo } = data;
  const total = data.taskStats?.total ?? tasks.length;
  const completed = data.taskStats?.completed ?? tasks.filter((task) => task.completed).length;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const readiness = analysis ? clampPercent(analysis.readiness_score) : null;
  const alerts = (alertData?.alerts ?? []).filter((alert) => !dismissed.has(alert.id));
  const matches = recommendations?.current_fit_companies ?? [];
  const recentDays = progress?.heatmap?.slice(-7) ?? [];
  const recentActivity = recentDays.reduce((sum, day) => sum + day.count, 0);
  const activeDays = recentDays.filter((day) => day.count > 0).length;
  const queued = tasks.filter((task) => !task.completed).sort((left, right) => (left.priority || 5) - (right.priority || 5));
  const priorities = (analysis?.missing_skills ?? []).slice(0, 3);
  const preparationSteps = [
    { title: "Introduce yourself", detail: "Skills, projects, and career goals", href: "/profile", done: !!profile?.onboarding_complete },
    { title: "Understand your starting point", detail: "A strengths and gaps assessment", href: "/profile", done: !!analysis },
    { title: "Set up your practice", detail: "A plan with concrete weekly tasks", href: "/tasks", done: total > 0 },
    { title: "Explore your opportunities", detail: "Companies matched to your profile", href: "/companies", done: !!recommendations },
  ];
  const next = !profile?.onboarding_complete
    ? { title: "Complete your profile", description: "Add your skills and goals to make the workspace yours.", href: "/onboarding", icon: User }
    : !analysis
      ? { title: "Get a readiness assessment", description: "See your strengths and decide what to work on next.", href: "/profile", icon: Sparkles }
      : { title: "Keep your plan moving", description: "Pick up your next practice task or build a weekly plan.", href: "/tasks", icon: ClipboardList };

  return (
    <div className="workspace-page space-y-7">
      <WorkspaceHeading label="Overview" title={firstName ? `Welcome, ${firstName}.` : "Your career workspace."} description="A clear view of where you stand and what to work on next." actions={<ActionLink href="/progress">View progress</ActionLink>} />

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="relative isolate overflow-hidden">
          <div className="flex h-full min-h-52 flex-wrap items-center justify-between gap-6">
            <div className="max-w-sm">
              <p className="eyebrow mb-3">Your next step</p>
              <h2 className="text-balance text-2xl font-semibold sm:text-3xl">{next.title}</h2>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-muted-foreground">{next.description}</p>
              <Link href={next.href} className={buttonVariants()}>{next.title === "Keep your plan moving" ? "Open practice" : "Get started"}<ArrowRight /></Link>
            </div>
            <ReadinessLens>
              {readiness === null ? <next.icon className="size-11 text-primary/85" aria-hidden="true" /> : (
                <div className="relative text-center">
                  <p className="text-4xl font-semibold tabular-nums text-primary">{readiness}<span className="text-base">%</span></p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Readiness</p>
                </div>
              )}
            </ReadinessLens>
          </div>
        </Panel>

        <Panel>
          <PanelHeading title="At a glance" />
          <dl className="divide-y divide-border">
            {[
              { icon: CheckCircle2, label: "Practice completed", value: `${completed} / ${total}` },
              { icon: Flame, label: "Current streak", value: `${streakInfo?.streak.current ?? 0} days` },
              { icon: Sparkles, label: "Experience", value: `${streakInfo?.xp.total ?? 0} XP` },
              { icon: Target, label: "Company matches", value: String(matches.length) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <dt className="flex items-center gap-2.5 text-sm text-muted-foreground"><Icon className="size-4 text-primary" />{label}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 flex justify-between gap-2 text-xs text-muted-foreground"><span>Practice completion</span><span>{total ? Math.round(completed * 100 / total) : 0}%</span></div>
            <PercentBar value={total ? completed * 100 / total : 0} label="All practice completion" />
          </div>
        </Panel>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel>
          <PanelHeading title="Your week in practice" description="Completed tasks and interview sessions started over the last seven days." action={progress && <Tag tone="accent">{recentActivity} activities</Tag>} />
          {loadingProgress ? <p role="status" className="text-sm text-muted-foreground">Loading your activity…</p> : progressError ? <ErrorNotice error={progressError} retry={() => void refreshProgress()} /> : recentDays.length ? <ActivityBars days={recentDays} /> : <p className="text-sm text-muted-foreground">Your daily activity will appear here as you practice.</p>}
          {progress && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
            <p className="text-muted-foreground">{activeDays} active {activeDays === 1 ? "day" : "days"} this week</p>
            <ActionLink href="/progress" variant="ghost">Explore activity</ActionLink>
          </div>}
        </Panel>
        <Panel>
          <PanelHeading title="A focus worth your time" description="Suggested from your latest assessment." action={<IconTile icon={Target} />} />
          {priorities.length ? <ul className="space-y-4">{priorities.map((gap, index) => <li key={index}>
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{typeof gap === "string" ? gap : gap.skill}</p>{typeof gap !== "string" && gap.importance && <Tag tone={gap.importance === "critical" ? "warning" : "neutral"}>{prettyLabel(gap.importance)}</Tag>}</div>
            {typeof gap !== "string" && gap.reason && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{gap.reason}</p>}
          </li>)}</ul> : <p className="text-sm leading-relaxed text-muted-foreground">{analysis ? "Build on the strengths in your latest assessment, or refresh it after adding new experience." : "Run a profile assessment to see which skills deserve the most attention."}</p>}
          <div className="mt-5"><ActionLink href={analysis ? "/roadmap" : "/profile"} variant="outline">{analysis ? "Plan your focus" : "Open profile"}</ActionLink></div>
        </Panel>
      </div>

      {alerts.length > 0 && (
        <Panel>
          <PanelHeading title="Worth your attention" />
          <ul className="divide-y divide-border">
            {alerts.map((alert) => (
              <li className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0" key={alert.id}>
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-semibold">{alert.title.replace(/^[^\p{L}\p{N}]+/u, "")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                </div>
                {alert.action && <ActionLink href={alert.action.href} variant="ghost">{alert.action.label}</ActionLink>}
                <Button variant="ghost" size="icon" aria-label={`Dismiss ${alert.title}`} onClick={() => setDismissed((current) => new Set(current).add(alert.id))}><X /></Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeading title="Up next on your board" description="Unfinished tasks from your recent practice, ordered by priority." action={<ActionLink href="/tasks" variant="ghost">View board</ActionLink>} />
          {queued.length ? (
            <ul className="divide-y divide-border">
              {queued.slice(0, 4).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0"><p className="break-words text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{prettyLabel(task.category)}{task.week_number ? ` · Week ${task.week_number}` : ""}</p></div>
                  <Tag tone={task.priority === 1 ? "warning" : "neutral"}>{task.priority === 1 ? "High priority" : prettyLabel(task.difficulty) || "To do"}</Tag>
                </li>
              ))}
            </ul>
          ) : <Notice icon={ClipboardList} title={total ? "Your recent practice is complete" : "Room for your first task"} description={total ? "Open the board to revisit previous work or generate another week." : "Generate a weekly practice plan once your profile is assessed."} />}
        </Panel>
        <Panel>
          <PanelHeading title="Company matches" action={<ActionLink href="/companies" variant="ghost">Explore</ActionLink>} />
          {matches.length ? (
            <ul className="divide-y divide-border">
              {matches.slice(0, 3).map((match, index) => (
                <li key={`${match.name}-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div><p className="font-medium">{match.name}</p><p className="text-sm text-muted-foreground">{match.role}</p></div>
                  <Tag tone="accent">{clampPercent(match.match_score)}% fit</Tag>
                </li>
              ))}
            </ul>
          ) : <Notice icon={Building2} title="Explore where you fit" description="Get suggested companies based on your skills and preferences." />}
        </Panel>
      </div>

      {analysis?.summary && <Panel><PanelHeading title="Readiness assessment" action={<ActionLink href="/profile" variant="ghost">Full assessment</ActionLink>} /><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p></Panel>}

      <Panel>
        <PanelHeading title="Your preparation, connected" description="Each step adds useful context to the next. Choose any step to revisit it." action={<Tag>{preparationSteps.filter((step) => step.done).length} of {preparationSteps.length} ready</Tag>} />
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {preparationSteps.map((step, index) => <li key={step.title}><Link href={step.href} className="flex h-full items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-background/45">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-xs font-semibold text-primary">{step.done ? <CheckCircle2 className="size-4" /> : `0${index + 1}`}</span>
            <span><span className="block text-sm font-semibold">{step.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{step.detail}</span></span>
          </Link></li>)}
        </ol>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/roadmap", icon: Map, title: "Plan your next milestone" },
          { href: "/interview", icon: Mic, title: "Practice an interview" },
        ].map(({ href, icon, title }) => (
          <Link key={href} href={href} className="glass-panel flex items-center gap-3 p-4 text-sm font-medium transition-colors hover:bg-background/45">
            <IconTile icon={icon} />{title}<ArrowUpRight className="ml-auto size-4 text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
