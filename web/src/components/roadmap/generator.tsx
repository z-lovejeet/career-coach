"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { api, readNDJSON } from "@/lib/api";
import type { CareerMatch, TraceStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgentTrace } from "./trace";

type Option = { code: string; title: string; family: string; match?: number };

/** Roadmap request form + live agent trace while it generates. */
export function RoadmapGenerator({ matches, defaults, compact }: { matches: CareerMatch[]; defaults: { hoursPerWeek: number; timelineMonths: number; goal?: string }; compact?: boolean }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Option | null>(matches[0] ? { code: matches[0].code, title: matches[0].title, family: matches[0].family, match: matches[0].match } : null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Option[]>([]);
  const [hours, setHours] = useState(defaults.hoursPerWeek);
  const [months, setMonths] = useState(defaults.timelineMonths);
  const [focus, setFocus] = useState("");
  const [steps, setSteps] = useState<TraceStep[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => api<Option[]>(`/api/careers/search?q=${encodeURIComponent(query)}`).then(setResults).catch(() => {}), 220);
    return () => clearTimeout(t);
  }, [query]);

  async function generate() {
    setError("");
    setSteps([]);
    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCode: picked?.code, targetQuery: !picked && query ? query : undefined, hoursPerWeek: hours, timelineMonths: months, focus: focus || undefined }),
      });
      let savedId: string | null = null;
      await readNDJSON(response, (event) => {
        if (event.type === "step") {
          const step = event.step as TraceStep;
          setSteps((prev) => {
            const list = [...(prev ?? [])];
            const i = list.findIndex((s) => s.id === step.id);
            if (i >= 0) list[i] = step; else list.push(step);
            return list;
          });
        } else if (event.type === "saved") savedId = event.id as string;
        else if (event.type === "error") throw new Error(event.message as string);
      });
      if (savedId) {
        toast.success("Your roadmap is ready.");
        router.push(`/roadmap/${savedId}`);
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (steps) {
    return (
      <section className="card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Roadmap agent</p>
            <h2 className="display mt-1 text-2xl text-ink">{picked ? `Planning your path to ${picked.title}` : "Planning your path"}</h2>
          </div>
          {!error && <span className="flex items-center gap-2 text-xs text-muted"><span className="size-2 animate-pulse rounded-full bg-accent" /> Working</span>}
        </div>
        <AgentTrace steps={steps} />
        {error && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-danger-soft px-4 py-3">
            <p className="text-sm text-danger">{error}</p>
            <Button size="sm" variant="outline" onClick={() => setSteps(null)}>Back</Button>
          </div>
        )}
      </section>
    );
  }

  const options: Option[] = query.trim().length >= 2 ? results : matches.slice(0, 6).map((m) => ({ code: m.code, title: m.title, family: m.family, match: m.match }));

  return (
    <section className={cn("card", compact ? "p-6" : "p-6 sm:p-8")}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-[13px] font-medium text-ink-2">1 · Destination career</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null); }} placeholder="Search 910 careers — e.g. Data Scientist, Product Manager" className="pl-10" />
          </div>
          <p className="mt-4 mb-2 text-xs text-muted">{query.trim().length >= 2 ? "Search results (O*NET titles and alternate titles)" : "Your top matches from the career model"}</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map((o) => (
              <li key={o.code}>
                <button type="button" onClick={() => setPicked(o)}
                  className={cn("flex h-full w-full items-start justify-between gap-3 rounded-[11px] border px-3.5 py-3 text-left transition-all",
                    picked?.code === o.code ? "border-accent bg-accent-soft/60 ring-1 ring-accent" : "border-line hover:border-line-strong")}>
                  <span className="min-w-0"><span className="block text-[14px] font-medium leading-snug text-ink">{o.title}</span><span className="mt-0.5 block text-xs text-muted">{o.family}</span></span>
                  {o.match !== undefined && <span className="num shrink-0 text-xs text-accent">{o.match}%</span>}
                </button>
              </li>
            ))}
            {!options.length && <li className="col-span-2 py-6 text-center text-sm text-muted">No careers found — try a broader term.</li>}
          </ul>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-[13px] font-medium text-ink-2">2 · Pace</p>
            <div className="mt-4 space-y-5">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between text-sm"><span className="text-muted">Hours per week</span><span className="num text-lg text-ink">{hours}</span></div>
                <input type="range" min={3} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full" aria-label="Hours per week" />
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between text-sm"><span className="text-muted">Timeline</span><span className="num text-lg text-ink">{months} mo</span></div>
                <input type="range" min={1} max={18} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full" aria-label="Timeline months" />
              </div>
            </div>
          </div>
          <Field label="3 · Anything specific? (optional)">
            <Textarea value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. I prefer free resources, and want to prepare for GATE too" className="min-h-20" />
          </Field>
          <Button size="lg" className="w-full" onClick={generate} disabled={!picked && query.trim().length < 2}>
            <Sparkles /> Generate my roadmap <ArrowRight />
          </Button>
          <p className="text-center text-xs text-faint">7 agent steps · usually 10–25 seconds</p>
        </div>
      </div>
    </section>
  );
}
