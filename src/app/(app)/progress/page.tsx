"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowRight, CalendarDays, Check, Flame, Lock, Sparkles, Target, Trophy } from "lucide-react";
import { request } from "@/components/workspace/api";
import { ActivityBars, ProgressRow, type ProgressOverview } from "@/components/workspace/activity";
import { ActionLink, ErrorNotice, IconTile, Notice, Panel, PanelHeading, PercentBar, prettyLabel, Tag, WorkspaceHeading, WorkspaceSkeleton } from "@/components/workspace/ui";

const dayFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const activityColors = ["bg-primary/8", "bg-primary/22", "bg-primary/42", "bg-primary/65", "bg-primary"];
const xpSources = {
  tasks: { label: "Practice tasks", detail: "10 XP per completed task" },
  interviews: { label: "Mock interviews", detail: "25 XP per completed session" },
  analyses: { label: "Profile assessments", detail: "15 XP per saved assessment" },
  streakBonus: { label: "Current streak bonus", detail: "20 XP from 3 days, 50 XP from 7 days" },
};
const categoryNames: Record<string, string> = {
  dsa: "Algorithms", web_dev: "Web development", system_design: "System design",
  soft_skills: "Communication", project: "Projects", other: "Other",
};

export default function ProgressPage() {
  const { data, isLoading, error, mutate } = useSWR("/api/streak", request<ProgressOverview>);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  if (isLoading) return <WorkspaceSkeleton />;
  if (!data) return <div className="workspace-page"><ErrorNotice error={error} retry={() => void mutate()} /></div>;

  const { streak, xp, stats, achievements, heatmap, categoryBreakdown } = data;
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const categories = Object.entries(categoryBreakdown).sort((left, right) => right[1].total - left[1].total);
  const heatmapPadding = heatmap.length ? (new Date(heatmap[0].date).getUTCDay() + 6) % 7 : 0;
  const lastWeek = heatmap.slice(-7);
  const previousWeek = heatmap.slice(-14, -7);
  const lastMonth = heatmap.slice(-30);
  const weeklyActivities = lastWeek.reduce((sum, day) => sum + day.count, 0);
  const previousActivities = previousWeek.reduce((sum, day) => sum + day.count, 0);
  const weeklyDifference = weeklyActivities - previousActivities;
  const monthlyActivities = lastMonth.reduce((sum, day) => sum + day.count, 0);
  const monthlyActiveDays = lastMonth.filter((day) => day.count > 0).length;
  const busiestDay = [...lastMonth].sort((left, right) => right.count - left.count)[0];
  const dayDetail = heatmap.find((day) => day.date === selectedDate) ?? heatmap.at(-1);
  const remainingXP = Math.max(0, xp.xpForNextLevel - xp.total);
  const nextMilestones = achievements.filter((achievement) => !achievement.unlocked).slice(0, 3);
  const nextTopic = categories.filter(([, counts]) => counts.total > counts.completed)
    .sort((left, right) => (right[1].total - right[1].completed) - (left[1].total - left[1].completed))[0];

  return (
    <div className="workspace-page space-y-7">
      <WorkspaceHeading label="Progress" title="A clearer view of your growth." description="Understand your consistency, spot unfinished work, and choose a useful next step." actions={<ActionLink href="/tasks">Open practice</ActionLink>} />

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeading title="Your recent rhythm" description="Completed tasks and interview sessions started over the last seven days." action={<Tag tone="accent">{weeklyActivities} activities</Tag>} />
          {lastWeek.length ? <ActivityBars days={lastWeek} /> : <p className="text-sm text-muted-foreground">Your activity appears here as you start practicing.</p>}
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            {weeklyDifference === 0 ? "The same number of activities as the previous seven days." : `${Math.abs(weeklyDifference)} ${weeklyDifference > 0 ? "more" : "fewer"} activities than the previous seven days.`}
          </p>
        </Panel>
        <Panel>
          <PanelHeading title="Keep the next step simple" action={<IconTile icon={Target} />} />
          {nextTopic ? (
            <>
              <p className="text-2xl font-semibold">{categoryNames[nextTopic[0]] || prettyLabel(nextTopic[0])}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">You have {nextTopic[1].total - nextTopic[1].completed} unfinished {nextTopic[1].total - nextTopic[1].completed === 1 ? "task" : "tasks"} in this topic. Choose one concrete outcome for your next session.</p>
              <div className="mt-5"><ActionLink href="/tasks" variant="default">Choose a task</ActionLink></div>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">Try a new challenge.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Use a mock interview to practice explaining your thinking, or build the next week of your plan.</p>
              <div className="mt-5"><ActionLink href="/interview" variant="default">Practice an interview</ActionLink></div>
            </>
          )}
          <div className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Streaks count consecutive days with completed tasks. Starting an interview adds activity to the calendar.</div>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Flame, label: "Current streak", value: `${streak.current} days`, detail: `Your longest streak is ${streak.longest} days` },
          { icon: Check, label: "Tasks completed", value: String(stats.completedTasks), detail: `${Math.max(0, stats.totalTasks - stats.completedTasks)} tasks remaining across all weeks` },
          { icon: Trophy, label: "Milestones earned", value: `${unlocked} / ${achievements.length}`, detail: `${stats.completedInterviews} completed interview sessions` },
          { icon: Sparkles, label: "Experience level", value: `Level ${xp.level}`, detail: `${xp.total} XP earned from your current record` },
        ].map(({ icon, label, value, detail }) => (
          <Panel key={label}>
            <IconTile icon={icon} />
            <p className="mt-4 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 text-sm font-medium">{label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeading title="Your last 30 days" description="A longer view of how often you’ve made time for preparation." />
        <dl className="grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Days with activity</dt>
            <dd className="mt-2">
              <p className="text-3xl font-semibold tabular-nums">{monthlyActiveDays}<span className="text-base font-normal text-muted-foreground"> / {lastMonth.length}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Days with a task completion or interview started</p>
            </dd>
          </div>
          <div className="sm:border-l sm:border-border sm:pl-5">
            <dt className="text-sm text-muted-foreground">Recorded activities</dt>
            <dd className="mt-2">
              <p className="text-3xl font-semibold tabular-nums">{monthlyActivities}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across practice and interview sessions</p>
            </dd>
          </div>
          <div className="sm:border-l sm:border-border sm:pl-5">
            <dt className="text-sm text-muted-foreground">Most active day</dt>
            <dd className="mt-2">
              <p className="text-xl font-semibold">{busiestDay?.count ? dayFormat.format(new Date(busiestDay.date)) : "Ready when you are"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{busiestDay?.count ? `${busiestDay.count} activities recorded that day` : "Your first activity will start the picture"}</p>
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel>
        <PanelHeading title="Activity calendar" description="Select a day to inspect its activity. Dates follow UTC." action={<IconTile icon={CalendarDays} />} />
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-max grid-flow-col grid-rows-7 gap-1.5" aria-label="Daily activity">
            {Array.from({ length: heatmapPadding }, (_, index) => <span key={index} aria-hidden="true" />)}
            {heatmap.map(({ date, count }) => {
              const label = `${dayFormat.format(new Date(date))}: ${count} ${count === 1 ? "activity" : "activities"}`;
              return <button type="button" key={date} title={label} aria-label={label} aria-pressed={dayDetail?.date === date} onClick={() => setSelectedDate(date)} className={`h-5 min-w-5 rounded-[5px] ${dayDetail?.date === date ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${activityColors[Math.max(0, Math.min(count, 4))]}`} />;
            })}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground" role="status">{dayDetail ? `${dayFormat.format(new Date(dayDetail.date))} · ${dayDetail.count} ${dayDetail.count === 1 ? "activity" : "activities"}` : "Your daily activity will appear here."}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">Less {activityColors.map((color) => <span className={`size-3 rounded-sm ${color}`} key={color} />)} More</div>
        </div>
      </Panel>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeading title="Practice by topic" description="Completion reflects the tasks you’ve marked finished in each area." />
          {categories.length ? (
            <ul className="space-y-5">
              {categories.map(([category, counts]) => <li key={category}><ProgressRow label={categoryNames[category] || prettyLabel(category)} value={counts.completed} total={counts.total} description={`${counts.total - counts.completed} remaining`} /></li>)}
            </ul>
          ) : <Notice title="Your topics will appear here" description="Generate a practice week to start tracking work by topic." />}
        </Panel>
        <Panel>
          <PanelHeading title="How your experience adds up" description="Experience is calculated from completed work and your current streak bonus." />
          <div className="mb-5 rounded-2xl border border-border bg-primary/5 p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs text-muted-foreground">Next level</p><p className="mt-1 text-2xl font-semibold">{remainingXP} XP away</p></div><Tag>Level {xp.level + 1}</Tag></div>
            <PercentBar value={xp.xpProgress} label="Progress toward next level" />
            <p className="mt-2 text-xs text-muted-foreground">{xp.total} / {xp.xpForNextLevel} XP</p>
          </div>
          <dl className="divide-y divide-border">
            {Object.entries(xp.breakdown).map(([key, value]) => {
              const source = xpSources[key as keyof typeof xpSources];
              return <div key={key} className="flex items-center justify-between gap-3 py-3"><dt><p className="text-sm font-medium">{source?.label || prettyLabel(key)}</p>{source?.detail && <p className="mt-1 text-xs text-muted-foreground">{source.detail}</p>}</dt><dd className="shrink-0 text-sm font-semibold tabular-nums">+{value} XP</dd></div>;
            })}
          </dl>
        </Panel>
      </div>

      {nextMilestones.length > 0 && <Panel>
        <PanelHeading title="Your next milestones" description="Small, specific goals to keep your practice moving." />
        <div className="grid gap-3 md:grid-cols-3">
          {nextMilestones.map((milestone) => {
            const interview = milestone.id.includes("interview");
            const assessment = milestone.id.includes("analysis");
            return <article key={milestone.id} className="flex flex-col items-start rounded-2xl border border-border bg-background/15 p-4"><IconTile icon={Trophy} /><h3 className="mt-3 text-sm font-semibold">{milestone.title}</h3><p className="mb-4 mt-1 flex-1 text-sm text-muted-foreground">{milestone.desc}</p><ActionLink href={interview ? "/interview" : assessment ? "/profile" : "/tasks"} variant="ghost">{interview ? "Practice an interview" : assessment ? "Open profile" : "Keep practicing"}</ActionLink></article>;
          })}
        </div>
      </Panel>}

      <Panel>
        <PanelHeading title="Your milestone collection" description="Every milestone stays visible as a record of what you’ve achieved." action={<Tag tone="accent">{unlocked} unlocked</Tag>} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <li key={achievement.id} className="flex items-start gap-3 rounded-2xl border border-border p-4">
              <IconTile icon={achievement.unlocked ? Trophy : Lock} />
              <div><p className="text-sm font-semibold">{achievement.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{achievement.desc}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">{achievement.unlocked ? <Check className="size-3" /> : <ArrowRight className="size-3" />}{achievement.unlocked ? "Earned" : "In progress"}</p></div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
