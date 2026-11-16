"use client";

import { useState } from "react";
import { Check, ChevronDown, CircleSlash, Cpu, Database, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import type { TraceStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND: Record<string, { label: string; tone: "accent" | "warm" | "neutral" }> = {
  analyst: { label: "LLM agent", tone: "accent" },
  matcher: { label: "ML model", tone: "warm" },
  target: { label: "Rules", tone: "neutral" },
  gaps: { label: "O*NET data", tone: "neutral" },
  planner: { label: "LLM agent", tone: "accent" },
  composer: { label: "LLM agent", tone: "accent" },
  critic: { label: "Rules + LLM", tone: "accent" },
};

function Detail({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((v, i) => (
          <li key={i} className="flex gap-2 text-[13px] text-ink-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" />
            {typeof v === "object" && v !== null
              ? <span>{Object.entries(v).map(([k, x]) => <span key={k} className="mr-3"><span className="text-muted">{k}</span> {typeof x === "number" && x <= 1 && !Number.isInteger(x) ? `${Math.round(x * 100)}%` : String(x)}</span>)}</span>
              : <span>{String(v)}</span>}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <dl className="space-y-2.5">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <dt className="mb-1 text-[11px] font-medium uppercase tracking-wider text-faint">{k.replace(/([A-Z])/g, " $1")}</dt>
            <dd><Detail value={v} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span className="text-[13px] text-ink-2">{String(value)}</span>;
}

export function AgentTrace({ steps, compact = false }: { steps: TraceStep[]; compact?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const kind = KIND[step.id] ?? { label: "Agent", tone: "neutral" as const };
        const expanded = open === step.id;
        return (
          <li key={step.id} className="relative grid grid-cols-[28px_1fr] gap-3 pb-5 last:pb-0 animate-rise">
            {i < steps.length - 1 && <span className="absolute left-[13.5px] top-7 h-[calc(100%-20px)] w-px bg-line" />}
            <span className={cn(
              "relative z-10 mt-0.5 grid size-7 place-items-center rounded-full border text-xs",
              step.status === "done" && "border-accent bg-accent text-accent-ink",
              step.status === "running" && "border-accent bg-surface text-accent",
              step.status === "skipped" && "border-line-strong bg-surface-2 text-muted",
              step.status === "error" && "border-danger bg-danger-soft text-danger",
            )}>
              {step.status === "done" ? <Check className="size-3.5" /> : step.status === "running" ? <Loader2 className="size-3.5 animate-spin" /> : step.status === "skipped" ? <CircleSlash className="size-3.5" /> : <X className="size-3.5" />}
            </span>
            <div className="min-w-0">
              <button type="button" onClick={() => setOpen(expanded ? null : step.id)} className="group flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left" disabled={!step.detail}>
                <span className="text-[14px] font-semibold text-ink">{step.agent}</span>
                <Badge tone={kind.tone}>{kind.label}</Badge>
                {step.model && <Badge tone="outline"><Cpu /> {step.model.replace("openai/", "")}</Badge>}
                {step.cached && <Badge tone="success"><Database /> cached</Badge>}
                {typeof step.ms === "number" && <span className="num text-[11px] text-faint">{step.ms < 1000 ? `${step.ms} ms` : `${(step.ms / 1000).toFixed(1)} s`}</span>}
                {step.detail ? <ChevronDown className={cn("ml-auto size-4 text-faint transition-transform group-hover:text-ink", expanded && "rotate-180")} /> : null}
              </button>
              <p className="mt-0.5 text-[13px] text-muted">{step.title}</p>
              {step.summary && !compact && <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{step.summary}</p>}
              {expanded && step.detail ? <div className="mt-3 rounded-[10px] border border-line bg-surface-2 p-4 animate-fade"><Detail value={step.detail} /></div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
