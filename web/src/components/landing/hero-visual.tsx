import { BookOpen, Briefcase, Check, Cpu, Sparkles } from "lucide-react";
import type { RoadmapGraph, TraceStep } from "@/lib/types";

/**
 * Hero illustration drawn from a real, agent-generated sample roadmap:
 * three courses → the skills they build → the destination career, plus the agent's trace.
 */
export function HeroVisual({ graph, trace, persona }: { graph: RoadmapGraph; trace: TraceStep[]; persona?: string }) {
  const courses = graph.nodes.filter((n) => n.kind === "course").slice(0, 3);
  const skillIds = [...new Set(courses.flatMap((c) => graph.edges.filter((e) => e.from === c.id).map((e) => e.to)))];
  const skills = skillIds.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean).slice(0, 3);
  const career = graph.nodes.find((n) => n.kind === "career");

  const W = 560, rowH = 92, top = 46;
  const yOf = (i: number, n: number) => top + i * rowH + ((3 - n) * rowH) / 2 + 24;
  const edges = courses.flatMap((c, i) => skills.map((s, j) => (graph.edges.some((e) => e.from === c.id && e.to === s.id) ? { i, j } : null)).filter(Boolean)) as { i: number; j: number }[];
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;

  return (
    <div className="relative">
      <div className="card relative overflow-hidden p-5 shadow-float">
        <div className="mb-3 flex items-center justify-between text-[11px] text-muted">
          <span className="eyebrow">Generated roadmap</span>
          <span>{persona} · {graph.totalWeeks} weeks</span>
        </div>
        <div className="relative" style={{ height: top + rowH * 3 }}>
          <svg viewBox={`0 0 ${W} ${top + rowH * 3}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            {edges.map(({ i, j }) => <path key={`${i}-${j}`} d={curve(178, yOf(i, courses.length), 204, yOf(j, skills.length))} fill="none" stroke="var(--accent)" strokeOpacity={0.45} strokeWidth={1.3} vectorEffect="non-scaling-stroke" />)}
            {skills.map((_, j) => <path key={j} d={curve(360, yOf(j, skills.length), 398, top + rowH * 1.5 - 10 + 24)} fill="none" stroke="var(--line-strong)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
          </svg>
          <p className="absolute left-0 top-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Courses</p>
          <p className="absolute top-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint" style={{ left: "36.5%" }}>Skills</p>
          <p className="absolute top-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint" style={{ left: "71%" }}>Career</p>
          {courses.map((c, i) => (
            <div key={c.id} className="absolute flex w-[31.5%] items-center gap-2 rounded-[10px] border border-line bg-surface px-2 py-2 text-[10.5px] leading-tight sm:px-2.5 sm:text-[11.5px] text-ink" style={{ top: yOf(i, courses.length) - 20, left: 0 }}>
              <BookOpen className="hidden size-3.5 shrink-0 text-muted sm:block" /><span className="line-clamp-2">{c.title}</span>
            </div>
          ))}
          {skills.map((s, j) => (
            <div key={s.id} className="absolute flex w-[27.5%] items-center gap-2 rounded-[10px] border border-accent-line bg-accent-soft px-2 py-2 text-[10.5px] leading-tight sm:px-2.5 sm:text-[11.5px] text-ink" style={{ top: yOf(j, skills.length) - 18, left: "36.5%" }}>
              <Sparkles className="hidden size-3.5 shrink-0 text-accent sm:block" /><span className="line-clamp-2">{s.title}</span>
            </div>
          ))}
          {career && (
            <div className="absolute flex w-[29%] items-center gap-2 rounded-[10px] bg-ink px-2.5 py-3 text-[11px] font-medium sm:px-3 sm:text-[12px] leading-tight text-canvas dark:bg-accent dark:text-accent-ink" style={{ top: top + rowH * 1.5 - 30 + 24, left: "71%" }}>
              <Briefcase className="hidden size-4 shrink-0 sm:block" /><span className="line-clamp-2">{career.title}</span>
            </div>
          )}
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <p className="eyebrow mb-2.5">Agent trace</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {trace.slice(0, 7).map((s) => (
              <li key={s.id} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                <span className="grid size-3.5 place-items-center rounded-full bg-accent text-accent-ink"><Check className="size-2.5" /></span>
                {s.agent}
                {s.model && <span className="flex items-center gap-0.5 text-[10px] text-faint"><Cpu className="size-2.5" />{s.model.includes("local") ? "ML" : s.model.replace("openai/", "").replace("qwen/", "")}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
