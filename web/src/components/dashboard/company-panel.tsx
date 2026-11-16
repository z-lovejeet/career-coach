"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardHeader, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";

interface Company {
  name: string; type: string; roles: string[]; lookFor: string[]; why: string; prepare: string; locations: string[];
  tier: "reach" | "target" | "safe"; fit: number; matched: string[]; missing: string[];
}
interface Payload { target: string; data: Company[]; created_at: string }

const TIER = { reach: "warm", target: "accent", safe: "success" } as const;

export function CompanyPanel() {
  const [state, setState] = useState<Payload | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { api<Payload | null>("/api/companies").then(setState).catch(() => setState(null)); }, []);

  async function generate() {
    setBusy(true);
    setError("");
    try { setState(await api<Payload>("/api/companies", { method: "POST", json: {} })); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Card className="p-6">
      <CardHeader
        title="Companies to aim for"
        description={state ? `For ${state.target} · updated ${timeAgo(state.created_at)}` : "Suggested by the Company Scout agent; fit scored from your skills"}
        action={state && <Button variant="ghost" size="sm" onClick={generate} loading={busy}>{!busy && <RefreshCw />} Refresh</Button>}
      />
      {state === undefined ? (
        <div className="mt-5 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !state ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-sm text-muted">Get a shortlist of real companies hiring for your target career in India, with what each one screens for.</p>
          <Button variant="secondary" onClick={generate} loading={busy}><Sparkles /> Suggest companies</Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {state.data.slice(0, 7).map((c) => (
            <li key={c.name} className="py-3">
              <button type="button" onClick={() => setOpen(open === c.name ? null : c.name)} className="flex w-full items-center gap-3 text-left">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-2 text-[13px] font-semibold text-ink-2">{c.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="truncate text-[14px] font-medium text-ink">{c.name}</span><Badge tone={TIER[c.tier]}>{c.tier}</Badge></span>
                  <span className="block truncate text-xs text-muted">{c.roles.join(" · ")}</span>
                </span>
                <span className="text-right"><span className="num block text-sm text-ink">{c.fit}%</span><span className="block text-[10px] text-faint">fit</span></span>
              </button>
              {open === c.name && (
                <div className="mt-3 space-y-2.5 rounded-[10px] bg-surface-2 p-3.5 text-[13px] animate-fade">
                  <p className="text-ink-2">{c.why}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.lookFor.map((s) => <span key={s} className={cn("rounded-md px-2 py-0.5 text-xs", c.matched.includes(s) ? "bg-success-soft text-success" : "bg-sunken text-muted")}>{s}</span>)}
                  </div>
                  <p className="text-ink-2"><span className="font-medium text-ink">Prepare: </span>{c.prepare}</p>
                  {c.locations.length > 0 && <p className="flex items-center gap-1.5 text-xs text-muted"><Building2 className="size-3.5" /> {c.locations.join(", ")}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {state && <p className="mt-3 text-[11px] text-faint">AI suggestions — check each company&apos;s careers page for current openings.</p>}
    </Card>
  );
}
