import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PercentBar } from "./ui";

export interface ProgressOverview {
  streak: { current: number; longest: number };
  xp: {
    total: number;
    level: number;
    xpProgress: number;
    xpForNextLevel: number;
    breakdown: { tasks: number; interviews: number; analyses: number; streakBonus: number };
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalInterviews?: number;
    completedInterviews: number;
    totalAnalyses?: number;
  };
  achievements: Array<{ id: string; title: string; desc: string; unlocked: boolean }>;
  heatmap: Array<{ date: string; count: number }>;
  categoryBreakdown: Record<string, { total: number; completed: number }>;
}

const shortDay = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export function ActivityBars({ days }: { days: ProgressOverview["heatmap"] }) {
  const largest = Math.max(1, ...days.map((day) => day.count));
  return (
    <div className="grid grid-cols-7 items-end gap-2 sm:gap-3" role="img" aria-label={days.map((day) => `${fullDay.format(new Date(day.date))}, ${day.count} activities`).join(". ")}>
      {days.map((day) => (
        <div key={day.date} className="min-w-0 text-center">
          <p className="mb-2 text-xs tabular-nums text-muted-foreground">{day.count}</p>
          <div className="relative h-24 overflow-hidden rounded-lg bg-primary/7 sm:h-28">
            {day.count > 0 && <div className="absolute inset-x-0 bottom-0 rounded-lg bg-primary/65" style={{ height: `${Math.max(7, 100 * day.count / largest)}%` }} />}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{shortDay.format(new Date(day.date))}</p>
        </div>
      ))}
    </div>
  );
}

export function ProgressRow({ label, value, total, description, href }: {
  label: string;
  value: number;
  total: number;
  description?: string;
  href?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        {href ? <Link href={href} className="flex items-center gap-1 font-medium hover:text-primary">{label}<ArrowUpRight className="size-3.5" /></Link> : <p className="font-medium">{label}</p>}
        <p className="tabular-nums text-muted-foreground">{value} / {total}</p>
      </div>
      <PercentBar label={label} value={total ? 100 * value / total : 0} />
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
