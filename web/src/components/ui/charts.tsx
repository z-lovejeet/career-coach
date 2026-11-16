import { cn } from "@/lib/utils";

/** Circular gauge with tick marks — used for readiness. */
export function Gauge({ value, size = 168, label, sublabel }: { value: number; size?: number; label?: string; sublabel?: string }) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270° sweep
  const filled = (Math.min(100, Math.max(0, value)) / 100) * arc * c;
  const ticks = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]">
        {ticks.map((i) => {
          const angle = (i / (ticks.length - 1)) * arc * 2 * Math.PI;
          const x1 = size / 2 + Math.cos(angle) * (r + 9);
          const y1 = size / 2 + Math.sin(angle) * (r + 9);
          const x2 = size / 2 + Math.cos(angle) * (r + 12);
          const y2 = size / 2 + Math.sin(angle) * (r + 12);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-strong)" strokeWidth={1} />;
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth={8} strokeDasharray={`${arc * c} ${c}`} strokeLinecap="round" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={8}
          strokeDasharray={`${filled} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="num text-[44px] leading-none text-ink">{Math.round(value)}</p>
          {label && <p className="mt-1.5 text-xs font-medium text-muted">{label}</p>}
          {sublabel && <p className="text-[11px] text-faint">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

/** Small horizontal meter with label + value. */
export function Meter({ label, value, detail, tone = "accent" }: { label: string; value: number; detail?: string; tone?: "accent" | "warm" | "muted" }) {
  const color = tone === "warm" ? "var(--warm)" : tone === "muted" ? "var(--faint)" : "var(--accent)";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="truncate text-ink-2">{label}</span>
        <span className="num shrink-0 text-ink">{detail ?? `${Math.round(value)}%`}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
      </div>
    </div>
  );
}

/** GitHub-style activity grid (weeks × 7 days). */
export function Heatmap({ days, className }: { days: { date: string; count: number }[]; className?: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks: { date: string; count: number }[][] = [];
  days.forEach((d, i) => { (weeks[Math.floor(i / 7)] ??= []).push(d); });
  const level = (n: number) => (n === 0 ? 0 : Math.ceil((n / max) * 4));
  const fills = ["var(--sunken)", "color-mix(in oklab, var(--accent) 25%, var(--surface))", "color-mix(in oklab, var(--accent) 50%, var(--surface))", "color-mix(in oklab, var(--accent) 75%, var(--surface))", "var(--accent)"];
  return (
    <div className={cn("flex gap-[3px] overflow-x-auto scrollbar-thin", className)}>
      {weeks.map((week, w) => (
        <div key={w} className="flex flex-col gap-[3px]">
          {week.map((d) => (
            <div key={d.date} title={`${d.date}: ${d.count} activities`} className="size-[11px] rounded-[3px]" style={{ background: fills[level(d.count)] }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Radar chart for the RIASEC interest profile. */
export function Radar({ values, size = 220 }: { values: { label: string; value: number }[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 30;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  };
  const poly = values.map((v, i) => point(i, Math.max(0.04, v.value)).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={values.map((_, i) => point(i, s).join(",")).join(" ")} fill="none" stroke="var(--line)" />
      ))}
      {values.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />;
      })}
      <polygon points={poly} fill="color-mix(in oklab, var(--accent) 18%, transparent)" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = point(i, 1.22);
        return <text key={v.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-[var(--muted)] text-[10px] font-medium">{v.label}</text>;
      })}
    </svg>
  );
}

/** Minimal vertical bars (e.g. last 7 days). */
export function Bars({ data, height = 64 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="w-full rounded-[4px] bg-accent/85 transition-[height] duration-700" style={{ height: `${Math.max(3, (d.value / max) * (height - 18))}px`, opacity: d.value ? 1 : 0.25 }} title={`${d.label}: ${d.value}`} />
          <span className="text-[10px] text-faint">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
