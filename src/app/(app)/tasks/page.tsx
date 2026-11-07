"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ArrowDown, CalendarDays, Check, ClipboardList, Focus, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jsonRequest, request } from "@/components/workspace/api";
import { ActionLink, ErrorNotice, IconTile, Notice, Panel, PanelHeading, PercentBar, prettyLabel, selectClass, Tag, WorkspaceHeading, WorkspaceSkeleton } from "@/components/workspace/ui";
import type { Task } from "@/types";

const categories: Record<string, string> = {
  dsa: "Algorithms", web_dev: "Web development", system_design: "System design",
  soft_skills: "Soft skills", project: "Projects", other: "Other",
};
const dueDateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TasksPage() {
  const { data, isLoading, error, mutate } = useSWR("/api/tasks", request<Task[]>);
  const { mutate: revalidate } = useSWRConfig();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState("latest");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [day, setDay] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) return <WorkspaceSkeleton />;
  if (!data) return <div className="workspace-page"><ErrorNotice error={error} retry={() => void mutate()} /></div>;

  const weeks = [...new Set(data.flatMap((task) => task.week_number === null ? [] : [task.week_number]))].sort((a, b) => b - a);
  const activeWeek = week === "latest" ? weeks[0] : Number(week);
  const categoriesInUse = [...new Set(data.map((task) => task.category || "other"))];
  const weekTasks = data.filter((task) => week === "all" || activeWeek === undefined || task.week_number === activeWeek);
  const query = search.trim().toLowerCase();
  const filtered = weekTasks.filter((task) => (
    (category === "all" || (task.category || "other") === category)
    && (status === "all" || (status === "done" ? task.completed : !task.completed))
    && (day === null || task.day_number === day)
    && (!query || `${task.title} ${task.description || ""}`.toLowerCase().includes(query))
  ));
  const weekCompleted = weekTasks.filter((task) => task.completed).length;
  const weeklyDays = dayNames.map((name, index) => {
    const tasks = weekTasks.filter((task) => task.day_number === index + 1);
    return { name, number: index + 1, total: tasks.length, completed: tasks.filter((task) => task.completed).length };
  });
  const focusMix = [...new Set(weekTasks.map((task) => task.category || "other"))].map((name) => {
    const tasks = weekTasks.filter((task) => (task.category || "other") === name);
    return { name, total: tasks.length, completed: tasks.filter((task) => task.completed).length };
  }).sort((left, right) => right.total - left.total);
  const nextTask = weekTasks.filter((task) => !task.completed).sort((left, right) => (left.priority || 5) - (right.priority || 5) || (left.day_number || 8) - (right.day_number || 8))[0];
  const weeklyLabel = week === "all" ? "All practice weeks" : activeWeek === undefined ? "Your practice week" : `Week ${activeWeek}`;
  const done = filtered.filter((task) => task.completed).length;
  const groups = [...dayNames, "Unscheduled"].map((day, index) => ({
    day, tasks: filtered.filter((task) => index === 7 ? !task.day_number || task.day_number < 1 || task.day_number > 7 : task.day_number === index + 1),
  })).filter((group) => group.tasks.length);

  async function generate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await request<{ week_number: number }>("/api/tasks/generate", { method: "POST" });
      setWeek("latest");
      setCategory("all");
      setStatus("all");
      setDay(null);
      setSearch("");
      await mutate();
      toast.success(`Week ${result.week_number} is ready.`);
    } catch (failure) {
      setGenerateError(failure instanceof Error ? failure.message : "The weekly plan could not be generated.");
    } finally {
      setGenerating(false);
    }
  }

  async function toggle(task: Task) {
    if (pending.has(task.id)) return;
    setPending((ids) => new Set(ids).add(task.id));
    try {
      const saved = await request<Task>(`/api/tasks/${task.id}`, jsonRequest("PATCH", { completed: !task.completed }));
      await mutate((tasks) => tasks?.map((item) => item.id === task.id ? saved : item), { revalidate: false });
      void revalidate("/api/streak");
      void revalidate("/api/dashboard");
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "The task could not be updated.");
    } finally {
      setPending((ids) => {
        const next = new Set(ids);
        next.delete(task.id);
        return next;
      });
    }
  }

  return (
    <div className="workspace-page space-y-6">
      <WorkspaceHeading label="Practice" title="Your practice board." description="Build a week of focused work and keep track of what you finish." actions={
        <Button onClick={() => void generate()} disabled={generating}>{generating ? <Loader2 className="motion-safe:animate-spin" /> : <Plus />}{generating ? "Building plan…" : "Generate a week"}</Button>
      } />
      {generateError && <ErrorNotice error={new Error(generateError)} />}
      {data.length === 0 ? (
        <Panel><Notice icon={ClipboardList} title="Start your first week" description="Run a profile assessment, then generate tasks tailored to your skills and goals." action={<ActionLink href="/profile">Open profile</ActionLink>} /></Panel>
      ) : (
        <>
          <Panel>
            <PanelHeading title={weeklyLabel} description="See how your work is spread across the week. Select a day to focus your board." action={<Tag tone="accent">{weekCompleted} / {weekTasks.length} complete</Tag>} />
            <PercentBar label="Selected week completion" value={weekTasks.length ? 100 * weekCompleted / weekTasks.length : 0} />
            <div className="mt-5 grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-7" role="group" aria-label="Filter practice by day">
              {weeklyDays.map(({ name, number, total, completed }) => <button key={name} type="button" aria-pressed={day === number} onClick={() => setDay(day === number ? null : number)} className={`min-w-0 rounded-[14px] border p-3 text-left transition-colors ${day === number ? "border-primary/35 bg-primary/10" : "border-border bg-background/15 hover:bg-background/40"}`}>
                <span className="text-xs font-medium text-muted-foreground">{name.slice(0, 3)}</span>
                <span className="mt-2 block text-xl font-semibold tabular-nums">{completed}<span className="text-sm font-normal text-muted-foreground"> / {total}</span></span>
                <span className="mt-1 block text-[10px] text-muted-foreground">{total ? completed === total ? "Complete" : `${total - completed} remaining` : "Open day"}</span>
              </button>)}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><p>{weeklyDays.filter((item) => item.total > 0).length} days with planned work · {weekTasks.filter((task) => !task.completed && task.priority === 1).length} high-priority tasks remaining</p>{day !== null && <Button variant="ghost" size="sm" onClick={() => setDay(null)}>Show all days</Button>}</div>
          </Panel>

          <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
            <Panel>
              <PanelHeading title="A good place to start" description="Your highest-priority unfinished task from the selected practice weeks." action={<IconTile icon={Focus} />} />
              {nextTask ? <>
                <h3 className="text-lg font-semibold">{nextTask.title}</h3>
                {nextTask.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{nextTask.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2"><Tag>{categories[nextTask.category] || prettyLabel(nextTask.category)}</Tag>{nextTask.difficulty && <Tag>{prettyLabel(nextTask.difficulty)}</Tag>}</div>
                <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setCategory("all"); setStatus("todo"); setDay(nextTask.day_number && nextTask.day_number >= 1 && nextTask.day_number <= 7 ? nextTask.day_number : null); setSearch(nextTask.title); document.getElementById("practice-board")?.scrollIntoView({ block: "start" }); }}>Show task<ArrowDown /></Button><ActionLink href="/chat" variant="ghost">Get a hint</ActionLink></div>
              </> : <p className="text-sm leading-relaxed text-muted-foreground">{weekTasks.length ? "The tasks in these practice weeks are complete. Revisit a difficult topic or generate a fresh plan when you’re ready." : "Choose another practice week or generate a fresh plan to find your next task."}</p>}
            </Panel>
            <Panel>
              <PanelHeading title="Your practice mix" description="Planned tasks by topic in the selected week." />
              <ul className="space-y-3">{focusMix.map((focus) => <li key={focus.name}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm"><p>{categories[focus.name] || prettyLabel(focus.name)}</p><p className="tabular-nums text-muted-foreground">{focus.completed} / {focus.total}</p></div>
                <PercentBar label={`${categories[focus.name] || focus.name} completion`} value={100 * focus.completed / focus.total} />
              </li>)}</ul>
            </Panel>
          </div>

          <Panel className="scroll-mt-28" >
            <div id="practice-board" className="scroll-mt-28" />
            <PanelHeading title="Your task board" description={`${done} of ${filtered.length} displayed tasks complete. Refine the view to find the work you want to do.`} />
            <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1.5 text-sm font-medium">Search tasks
                <span className="relative"><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search your practice" /></span>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Week
                <select className={selectClass} value={week} onChange={(event) => { setWeek(event.target.value); setDay(null); }}>
                  <option value="latest">Latest week</option><option value="all">All weeks</option>
                  {weeks.map((number) => <option key={number} value={number}>Week {number}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Focus
                <select className={selectClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="all">All topics</option>
                  {categoriesInUse.map((item) => <option key={item} value={item}>{categories[item] || prettyLabel(item)}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Status
                <select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="all">All tasks</option><option value="todo">To do</option><option value="done">Completed</option>
                </select>
              </label>
            </div>
          </Panel>
          {groups.length === 0 && <Notice icon={CalendarDays} title="Nothing in this view" description="Clear your search or choose a different day, topic, or status." />}
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.day} className="glass-panel p-5 sm:p-7">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{group.day}</h2>
                  <Tag>{group.tasks.filter((task) => task.completed).length} / {group.tasks.length} complete</Tag>
                </div>
                <ul className="divide-y divide-border">
                  {group.tasks.map((task) => (
                    <li key={task.id} className="flex items-start gap-3 py-4 last:pb-0">
                      <Button
                        variant={task.completed ? "default" : "outline"}
                        size="icon"
                        aria-pressed={task.completed}
                        aria-label={`${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`}
                        disabled={pending.has(task.id)}
                        onClick={() => void toggle(task)}
                      >
                        {pending.has(task.id) ? <Loader2 className="motion-safe:animate-spin" /> : <Check className={task.completed ? "" : "opacity-45"} />}
                      </Button>
                      <div className="min-w-0 flex-1">
                        <p className={`break-words text-sm font-semibold ${task.completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
                        {task.description && <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{task.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Tag>{categories[task.category] || prettyLabel(task.category) || "Other"}</Tag>
                          {task.difficulty && <Tag tone={task.difficulty === "hard" ? "warning" : "neutral"}>{prettyLabel(task.difficulty)}</Tag>}
                          {task.priority === 1 && <Tag tone="warning">High priority</Tag>}
                          {week === "all" && task.week_number !== null && <Tag>Week {task.week_number}</Tag>}
                          {task.type && <Tag>{prettyLabel(task.type)}</Tag>}
                        </div>
                        {task.due_date && Number.isFinite(new Date(task.due_date).getTime()) && <p className="mt-2 text-xs text-muted-foreground">Due {dueDateFormat.format(new Date(task.due_date))}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <Panel>
            <PanelHeading title="Make each practice session count" description="A small routine that works across coding, system design, and communication tasks." />
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                { title: "Set a clear outcome", detail: "Read the task and decide what you should be able to explain or demonstrate by the end." },
                { title: "Try before asking", detail: "Work through an approach, record where you get stuck, then ask your mentor for a focused hint." },
                { title: "Close with a recap", detail: "Check the result, explain one decision aloud, and mark the task complete when you can repeat it." },
              ].map((step, index) => <li key={step.title} className="border-t border-border pt-4"><p className="eyebrow mb-2">0{index + 1}</p><h3 className="text-sm font-semibold">{step.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p></li>)}
            </ol>
          </Panel>
        </>
      )}
    </div>
  );
}
