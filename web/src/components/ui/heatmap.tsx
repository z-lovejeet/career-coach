"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

type Day = { date: string; count: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FILLS = [
  "var(--sunken)",
  "color-mix(in oklab, var(--accent) 25%, var(--surface))",
  "color-mix(in oklab, var(--accent) 50%, var(--surface))",
  "color-mix(in oklab, var(--accent) 75%, var(--surface))",
  "var(--accent)",
];
const weekday = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0

/**
 * Activity calendar: one column per week, one row per weekday (Monday first).
 * Fills the width of its container; on narrow screens it scrolls horizontally, starting at today.
 */
export function Heatmap({ days, className }: { days: Day[]; className?: string }) {
  const scroller = useRef<HTMLDivElement>(null);

  const { cells, weeks, months, max } = useMemo(() => {
    const lead = days.length ? weekday(days[0].date) : 0;
    const cells: (Day | null)[] = [...Array<null>(lead).fill(null), ...days];
    const weeks = Math.ceil(cells.length / 7);
    const months: { week: number; label: string }[] = [];
    let last = -1;
    for (let w = 0; w < weeks; w++) {
      const first = cells.slice(w * 7, w * 7 + 7).find(Boolean);
      if (!first) continue;
      const month = Number(first.date.slice(5, 7)) - 1;
      if (month !== last && (w > 0 || Number(first.date.slice(8)) <= 20)) months.push({ week: w, label: MONTHS[month] });
      last = month;
    }
    // Drop a leading label that would collide with the next one.
    if (months.length > 1 && months[1].week - months[0].week < 3) months.shift();
    return { cells, weeks, months, max: Math.max(1, ...days.map((d) => d.count)) };
  }, [days]);

  // Start scrolled to the most recent weeks when the calendar is wider than the screen.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [weeks]);

  const level = (n: number) => (n === 0 ? 0 : Math.ceil((n / max) * 4));
  const columns = `repeat(${weeks}, minmax(0, 1fr))`;

  return (
    <div className={className}>
      <div ref={scroller} className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="grid min-w-[760px] grid-cols-[30px_minmax(0,1fr)] gap-x-2.5 gap-y-2">
          <span />
          <div className="grid h-4 grid-rows-1 text-[11px] text-muted" style={{ gridTemplateColumns: columns, columnGap: 4 }}>
            {months.map((m) => <span key={`${m.label}-${m.week}`} className="whitespace-nowrap" style={{ gridColumn: m.week + 1, gridRow: 1 }}>{m.label}</span>)}
          </div>
          <div className="grid text-[11px] text-muted" style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))", rowGap: 4 }}>
            {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((label, i) => <span key={i} className="flex items-center">{label}</span>)}
          </div>
          <div className="grid" style={{ gridTemplateColumns: columns, gridTemplateRows: "repeat(7, minmax(0, 1fr))", gridAutoFlow: "column", gap: 4 }}>
            {cells.map((d, i) => d
              ? <div key={d.date} title={`${new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}: ${d.count} ${d.count === 1 ? "activity" : "activities"}`}
                  className="aspect-square rounded-[4px]" style={{ background: FILLS[level(d.count)] }} />
              : <div key={`pad-${i}`} className="aspect-square" />)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted">
        Less
        {FILLS.map((fill, i) => <span key={i} className={cn("size-3 rounded-[3px]")} style={{ background: fill }} />)}
        More
      </div>
    </div>
  );
}
