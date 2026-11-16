"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Mic, MicOff, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardHeader, Field, Input, Segmented } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { SUBJECTS } from "@/lib/subjects";
import { cn, timeAgo } from "@/lib/utils";

type Row = { id: string; config: { role: string; company: string; difficulty: string; type: string }; score: number | null; status: string; created_at: string };

export function InterviewSetup({ defaults, history }: { defaults: { role: string; companies: string[] }; history: Row[] }) {
  const router = useRouter();
  const [role, setRole] = useState(defaults.role);
  const [company, setCompany] = useState(defaults.companies[0] ?? "Google");
  const [subject, setSubject] = useState("Data Structures & Algorithms");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [type, setType] = useState<"technical" | "hr" | "mixed">("mixed");
  const [questions, setQuestions] = useState("5");
  const [voice, setVoice] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>("/api/interview", { method: "POST", json: { role, company, subject: type === "hr" ? "Behavioural" : subject, difficulty, type, questions: Number(questions), voice } });
      router.push(`/interview/${id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Role"><Input value={role} onChange={(e) => setRole(e.target.value)} /></Field>
          <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        </div>
        {defaults.companies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {defaults.companies.map((c) => (
              <button key={c} type="button" onClick={() => setCompany(c)} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", c === company ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-2 hover:border-line-strong")}>
                <Building2 className="size-3" /> {c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div><p className="mb-2 text-[13px] font-medium text-ink-2">Interview type</p><Segmented value={type} onChange={setType} options={[{ value: "technical", label: "Technical" }, { value: "mixed", label: "Mixed" }, { value: "hr", label: "HR" }]} /></div>
          <div><p className="mb-2 text-[13px] font-medium text-ink-2">Difficulty</p><Segmented value={difficulty} onChange={setDifficulty} options={[{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]} /></div>
        </div>

        {type !== "hr" && (
          <div className="mt-6">
            <p className="mb-2 text-[13px] font-medium text-ink-2">Technical focus</p>
            <div className="flex flex-wrap gap-1.5">
              {[...SUBJECTS.filter((s) => s.group === "academic").map((s) => s.name), "System Design", "Projects & Experience"].map((s) => (
                <button key={s} type="button" onClick={() => setSubject(s)} className={cn("rounded-full border px-3 py-1.5 text-[13px] transition-colors", s === subject ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-2 hover:border-line-strong")}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-end justify-between gap-5 border-t border-line pt-6">
          <div className="flex flex-wrap gap-6">
            <div><p className="mb-2 text-[13px] font-medium text-ink-2">Questions</p><Segmented size="sm" value={questions} onChange={setQuestions} options={["3", "5", "7"].map((v) => ({ value: v, label: v }))} /></div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-2">Answer by</p>
              <Segmented size="sm" value={voice ? "voice" : "text"} onChange={(v) => setVoice(v === "voice")} options={[{ value: "text", label: <span className="flex items-center gap-1"><MicOff className="size-3" /> Typing</span> }, { value: "voice", label: <span className="flex items-center gap-1"><Mic className="size-3" /> Voice</span> }]} />
            </div>
          </div>
          <Button size="lg" onClick={start} loading={busy} disabled={!role.trim() || !company.trim()}>Enter interview room <ArrowRight /></Button>
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader title="Past interviews" />
        {history.length ? (
          <ul className="mt-3 divide-y divide-line">
            {history.map((h) => (
              <li key={h.id}>
                <Link href={`/interview/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-ink">{h.config.company} · {h.config.role}</span><span className="block text-xs text-muted">{h.config.type} · {h.config.difficulty} · {timeAgo(h.created_at)}</span></span>
                  {h.status === "completed" ? <span className="num text-sm text-ink">{h.score}</span> : <Badge tone="warm">resume</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 flex items-start gap-2 text-sm text-muted"><Users className="mt-0.5 size-4 shrink-0" /> Your interview reports will be kept here.</p>}
      </Card>
    </div>
  );
}
