"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, GitBranch, History, Lightbulb, ListChecks, Loader2, Map as MapIcon, RotateCcw, Send, Sparkles, Target, Trash2, Workflow, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, Progress, Segmented, Textarea } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { applyOps, diffGraphs, layoutPhases, roadmapProgress, type RoadmapOp } from "@/lib/roadmap-ops";
import type { Roadmap, RoadmapGraph, RoadmapNode } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { GraphView } from "./graph-view";
import { NodePanel } from "./node-panel";
import { Timeline } from "./timeline";
import { AgentTrace } from "./trace";

type View = "map" | "timeline" | "trace" | "history";
type Suggestion = { title: string; reason: string; operations: RoadmapOp[] };
type Proposal = { graph: RoadmapGraph; message: string; note: string };

const QUICK = ["I already know Python well", "Compress this to 3 months", "Add more DSA practice", "More hands-on projects, fewer courses", "I can only give 6 hours a week"];

export function RoadmapWorkspace({ initial, revisions: initialRevisions, readOnly = false }: { initial: Roadmap; revisions: { version: number; note: string | null; created_at: string }[]; readOnly?: boolean }) {
  const router = useRouter();
  const [graph, setGraph] = useState<RoadmapGraph>(initial.graph);
  const [version, setVersion] = useState(initial.version);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [view, setView] = useState<View>("map");
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [thinking, setThinking] = useState<"apply" | "suggest" | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const queue = useRef(Promise.resolve());

  const shown = proposal?.graph ?? graph;
  const progress = roadmapProgress(shown);
  const node = selected ? shown.nodes.find((n) => n.id === selected) ?? null : null;
  const passed = shown.checks.filter((c) => c.passed).length;

  /** Optimistic save; requests are serialised so versions stay in order. */
  function save(next: RoadmapGraph, note: string) {
    if (readOnly) return;
    const previous = graph;
    layoutPhases(next);
    setGraph(next);
    queue.current = queue.current.then(async () => {
      setSaving(true);
      try {
        const saved = await api<Roadmap>(`/api/roadmap/${initial.id}`, { method: "PATCH", json: { graph: next, note } });
        setVersion(saved.version);
        setRevisions((r) => [{ version: saved.version, note, created_at: new Date().toISOString() }, ...r].slice(0, 20));
      } catch (e) {
        setGraph(previous);
        toast.error((e as Error).message);
      } finally {
        setSaving(false);
      }
    });
  }

  const updateNode = (id: string, patch: Partial<RoadmapNode>, note: string) => {
    const next = structuredClone(graph);
    Object.assign(next.nodes.find((n) => n.id === id)!, patch);
    save(next, note);
    if (patch.status === "done") toast.success("Nice — step completed. +15 XP");
  };

  async function askAgent(text: string) {
    if (!text.trim()) return;
    setThinking("apply");
    try {
      const res = await api<{ message: string; graph: RoadmapGraph }>(`/api/roadmap/${initial.id}/revise`, { method: "POST", json: { mode: "apply", instruction: text } });
      setProposal({ graph: res.graph, message: res.message, note: `Agent: ${text.slice(0, 80)}` });
      setInstruction("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setThinking(null);
    }
  }

  async function suggest() {
    setThinking("suggest");
    try {
      const res = await api<{ suggestions: Suggestion[] }>(`/api/roadmap/${initial.id}/revise`, { method: "POST", json: { mode: "suggest" } });
      setSuggestions(res.suggestions);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setThinking(null);
    }
  }

  async function restore(v: number) {
    try {
      const saved = await api<Roadmap>(`/api/roadmap/${initial.id}`, { method: "PATCH", json: { restoreVersion: v } });
      setGraph(saved.graph);
      setVersion(saved.version);
      setRevisions((r) => [{ version: saved.version, note: `Restored version ${v}`, created_at: new Date().toISOString() }, ...r]);
      toast.success(`Restored version ${v}.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function archive() {
    if (!confirm("Archive this roadmap? You can generate a new one any time.")) return;
    await api(`/api/roadmap/${initial.id}`, { method: "DELETE" });
    router.push("/roadmap");
    router.refresh();
  }

  const diff = proposal ? diffGraphs(graph, proposal.graph) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="animate-rise">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent"><Target /> {initial.target.family}</Badge>
          {initial.is_sample && <Badge tone="warm">Sample roadmap</Badge>}
          <span className="num text-xs text-faint">v{version}</span>
          {saving && <span className="flex items-center gap-1 text-xs text-muted"><Loader2 className="size-3 animate-spin" /> Saving</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <h1 className="display text-[34px] leading-[1.1] text-ink sm:text-[42px]">{initial.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{shown.summary}</p>
          </div>
          {!readOnly && <Button variant="ghost" size="sm" onClick={archive}><Trash2 /> Archive</Button>}
        </div>
        <div className="mt-6 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-4">
          {[
            { icon: ListChecks, label: "Progress", value: `${progress.percent}%`, extra: <Progress value={progress.percent} className="mt-2" /> },
            { icon: Clock, label: "Duration", value: `${shown.totalWeeks} weeks`, extra: <p className="mt-1 text-xs text-muted">{shown.hoursPerWeek} h/week</p> },
            { icon: GitBranch, label: "Steps", value: `${progress.done}/${progress.items}`, extra: <p className="mt-1 text-xs text-muted">{shown.phases.length} phases</p> },
            { icon: Check, label: "Critic checks", value: `${passed}/${shown.checks.length}`, extra: <p className="mt-1 text-xs text-muted">coverage &amp; feasibility</p> },
          ].map(({ icon: Icon, label, value, extra }) => (
            <div key={label} className="bg-surface px-5 py-4">
              <p className="flex items-center gap-1.5 text-xs text-muted"><Icon className="size-3.5" /> {label}</p>
              <p className="num mt-1 text-[22px] text-ink">{value}</p>
              {extra}
            </div>
          ))}
        </div>
      </header>

      {/* Proposal banner */}
      {proposal && diff && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-accent-line bg-accent-soft/60 px-5 py-4 animate-rise">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles className="size-4 text-accent" /> Agent proposal — preview</p>
            <p className="mt-1 text-sm text-ink-2">{proposal.message}</p>
            <p className="mt-1.5 text-xs text-muted">
              {diff.added.length} added · {diff.removed.length} removed · {diff.changed.length} changed · {diff.weeks[0]} → {diff.weeks[1]} weeks
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setProposal(null)}><X /> Discard</Button>
            <Button size="sm" onClick={() => { save(proposal.graph, proposal.note); setProposal(null); toast.success("Changes applied."); }}><Check /> Apply</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<View> value={view} onChange={setView} options={[
          { value: "map", label: <span className="flex items-center gap-1.5"><MapIcon className="size-3.5" /> Map</span> },
          { value: "timeline", label: <span className="flex items-center gap-1.5"><ListChecks className="size-3.5" /> Timeline</span> },
          { value: "trace", label: <span className="flex items-center gap-1.5"><Workflow className="size-3.5" /> Agent trace</span> },
          { value: "history", label: <span className="flex items-center gap-1.5"><History className="size-3.5" /> History</span> },
        ]} />
        <p className="text-xs text-muted">{view === "map" ? "Hover to trace a path · click a node for details" : view === "timeline" ? "Tick off steps, reorder, add your own" : ""}</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {view === "map" && <Card className="p-5 sm:p-6"><GraphView graph={shown} selected={selected} onSelect={setSelected} /></Card>}
          {view === "timeline" && <Timeline graph={shown} selected={selected} onSelect={setSelected} onChange={(g, note) => (proposal ? toast.info("Apply or discard the proposal first.") : save(g, note))} />}
          {view === "trace" && (
            <Card className="p-6 sm:p-7">
              <p className="mb-1 text-[15px] font-semibold text-ink">How the agent built this roadmap</p>
              <p className="mb-6 text-[13px] text-muted">Seven steps: two use the trained model and O*NET data, three call Groq LLMs, and the critic checks the result.</p>
              <AgentTrace steps={initial.trace} />
              <div className="mt-8 border-t border-line pt-6">
                <p className="mb-3 text-[13px] font-semibold text-ink">Critic checks</p>
                <ul className="space-y-2">{shown.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2.5 text-sm"><span className={cn("mt-0.5 grid size-4 place-items-center rounded-full", c.passed ? "bg-success text-white" : "bg-warm-soft text-warm")}>{c.passed ? <Check className="size-3" /> : "!"}</span><span><span className="text-ink">{c.label}</span> <span className="text-muted">— {c.detail}</span></span></li>
                ))}</ul>
              </div>
            </Card>
          )}
          {view === "history" && (
            <Card className="divide-y divide-line">
              {revisions.map((r) => (
                <div key={r.version} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div><p className="text-sm text-ink"><span className="num mr-2 text-faint">v{r.version}</span>{r.note ?? "Edited"}</p><p className="text-xs text-muted">{timeAgo(r.created_at)}</p></div>
                  {r.version !== version && !readOnly && <Button variant="ghost" size="sm" onClick={() => restore(r.version)}><RotateCcw /> Restore</Button>}
                  {r.version === version && <Badge tone="accent">Current</Badge>}
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="space-y-5">
          {node ? (
            <NodePanel graph={shown} node={node} readOnly={readOnly || !!proposal} onClose={() => setSelected(null)}
              onUpdate={(patch, note) => updateNode(node.id, patch, note)}
              onRemove={() => { save(applyOps(graph, [{ op: "remove", id: node.id }]), `Removed “${node.title}”`); setSelected(null); }} />
          ) : !readOnly ? (
            <Card className="p-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Sparkles className="size-4 text-accent" /> Ask the agent</p>
              <p className="mt-1 text-[13px] text-muted">Describe a change in plain words. You&apos;ll see a preview before anything is saved.</p>
              <form className="mt-4" onSubmit={(e) => { e.preventDefault(); void askAgent(instruction); }}>
                <Textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Replace the web course with something on MLOps" className="min-h-20 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void askAgent(instruction); }} />
                <Button type="submit" className="mt-2 w-full" loading={thinking === "apply"} disabled={!!thinking || !instruction.trim()}><Send /> Propose changes</Button>
              </form>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK.map((q) => <button key={q} type="button" disabled={!!thinking} onClick={() => askAgent(q)} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-accent hover:text-accent disabled:opacity-50">{q}</button>)}
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <Button variant="secondary" className="w-full" onClick={suggest} loading={thinking === "suggest"} disabled={!!thinking}><Lightbulb /> Suggest improvements</Button>
                {suggestions && (
                  <ul className="mt-4 space-y-3">
                    {suggestions.map((s, i) => (
                      <li key={i} className="rounded-[11px] border border-line p-3.5">
                        <p className="text-sm font-medium text-ink">{s.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{s.reason}</p>
                        <Button size="sm" variant="outline" className="mt-3" onClick={() => {
                          setProposal({ graph: applyOps(graph, s.operations), message: s.title, note: `Suggestion: ${s.title.slice(0, 80)}` });
                          setSuggestions((list) => list?.filter((_, j) => j !== i) ?? null);
                        }}>Preview</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <p className="text-[13px] font-semibold text-ink">Skill gaps this plan closes</p>
            <p className="mt-0.5 text-xs text-muted">From O*NET requirements for {initial.target.title}</p>
            <ul className="mt-4 space-y-3">
              {shown.gaps.slice(0, 6).map((g) => (
                <li key={g.id}>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-ink-2">{g.name}</span><span className="num text-muted">{Math.round(g.current * 100)} → {Math.round(g.required * 100)}</span></div>
                  <div className="relative h-1.5 rounded-full bg-sunken">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-warm/70" style={{ width: `${g.current * 100}%` }} />
                    <div className="absolute inset-y-[-2px] w-0.5 rounded bg-ink" style={{ left: `${g.required * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
