"use client";

import { use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, ArrowRight, Check, MessageCircle, RotateCcw, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, buttonClass, Card, Kbd, Progress, Skeleton } from "@/components/ui/primitives";
import { Markdown } from "@/components/markdown";
import { api, fetcher } from "@/lib/api";
import { findSubject, SECONDS_PER_QUESTION } from "@/lib/subjects";
import { cn } from "@/lib/utils";

type Question = { id: string; question: string; options: string[]; answer?: number; explanation?: string };
type Response = { questionId: string; chosen: number | null; correct: boolean; ms: number };
type Session = { id: string; subject: string; topic: string; difficulty: "easy" | "medium" | "hard"; total: number; correct: number; status: string; responses: Response[]; questions: Question[] };
type Graded = { correct: boolean; answer: number; explanation: string; chosen: number | null };

function restore(data: Session) {
  const graded: Record<string, Graded> = {};
  for (const r of data.responses) {
    const q = data.questions.find((x) => x.id === r.questionId);
    if (q?.answer !== undefined) graded[r.questionId] = { correct: r.correct, answer: q.answer, explanation: q.explanation ?? "", chosen: r.chosen };
  }
  return { graded, index: data.status === "completed" ? data.questions.length : data.responses.length };
}

/** Per-question countdown; keyed by question so it resets naturally. */
function Countdown({ limit, paused, onExpire, children }: { limit: number; paused: boolean; onExpire: () => void; children: (left: number) => ReactNode }) {
  const [left, setLeft] = useState(limit);
  const expire = useRef(onExpire);
  useEffect(() => { expire.current = onExpire; });
  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const t = setInterval(() => {
      const remaining = limit - Math.floor((Date.now() - start) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) { clearInterval(t); expire.current(); }
    }, 250);
    return () => clearInterval(t);
  }, [paused, limit]);
  return <>{children(left)}</>;
}

export default function PracticeSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, mutate } = useSWR<Session>(`/api/practice/${id}`, fetcher, { revalidateOnFocus: false });
  if (!data) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-80" /></div>;
  return <Runner key={data.id} data={data} refresh={() => void mutate()} />;
}

function Runner({ data, refresh }: { data: Session; refresh: () => void }) {
  const id = data.id;
  const [initial] = useState(() => restore(data));
  const [index, setIndex] = useState(initial.index);
  const [graded, setGraded] = useState<Record<string, Graded>>(initial.graded);
  const [busy, setBusy] = useState(false);
  const started = useRef(0);

  const q = data.questions[index] as Question | undefined;
  const result = q ? graded[q.id] : undefined;
  const limit = SECONDS_PER_QUESTION[data.difficulty];

  useEffect(() => { started.current = Date.now(); }, [q?.id]);

  const answer = useCallback(async (chosen: number | null) => {
    if (!q || result || busy) return;
    setBusy(true);
    try {
      const res = await api<{ correct: boolean; answer: number; explanation: string; completed: boolean }>(`/api/practice/${id}/answer`, {
        method: "POST", json: { questionId: q.id, chosen, ms: Date.now() - started.current },
      });
      setGraded((g) => ({ ...g, [q.id]: { ...res, chosen } }));
      if (res.completed) refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [q, result, busy, id, refresh]);

  // Keyboard: 1–4 to answer, Enter for next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (!result && ["1", "2", "3", "4"].includes(e.key)) void answer(Number(e.key) - 1);
      if (result && e.key === "Enter") setIndex((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, result, answer]);

  const answered = Object.keys(graded).length;
  const correct = Object.values(graded).filter((g) => g.correct).length;
  const subjectId = findSubject(data.subject)?.id ?? "";

  // Summary
  if (index >= data.questions.length) {
    const pct = Math.round((correct / Math.max(1, data.questions.length)) * 100);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/practice" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Practice</Link>
        <Card className="p-8 text-center animate-rise">
          <p className="eyebrow">{data.subject} · {data.topic}</p>
          <p className="num mt-4 text-[64px] leading-none text-ink">{pct}%</p>
          <p className="mt-2 text-muted">{correct} of {data.questions.length} correct · {data.difficulty}</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-2">{pct >= 80 ? "Strong session. Try the next difficulty up." : pct >= 50 ? "Solid base — review the misses below and go again." : "This topic needs work. Read the explanations, then retry at easy or medium."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/practice?subject=${subjectId}&topic=${encodeURIComponent(data.topic)}`} className={buttonClass("primary")}><RotateCcw /> Practise again</Link>
            <Link href={`/mentor?q=${encodeURIComponent(`Explain the key ideas of ${data.topic} (${data.subject}) that I keep getting wrong, with examples.`)}`} className={buttonClass("outline")}><MessageCircle /> Ask the mentor</Link>
          </div>
        </Card>
        <div className="space-y-3">
          {data.questions.map((question, i) => {
            const g = graded[question.id];
            return (
              <Card key={question.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", g?.correct ? "bg-success text-white" : "bg-danger-soft text-danger")}>{g?.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="num text-[11px] text-faint">Q{i + 1}</p>
                    <Markdown className="text-[14px] text-ink">{question.question}</Markdown>
                    <p className="mt-2 text-sm"><span className="text-muted">Answer: </span><span className="text-ink">{question.options[g?.answer ?? question.answer ?? 0]}</span>{g && !g.correct && <span className="text-danger"> · you chose {g.chosen === null ? "nothing (time)" : question.options[g.chosen]}</span>}</p>
                    <Markdown className="mt-2 text-[13px]">{g?.explanation ?? question.explanation ?? ""}</Markdown>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Countdown key={q?.id ?? "done"} limit={limit} paused={!!result || !q} onExpire={() => void answer(null)}>{(left) => (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/practice" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Practice</Link>
        <div className="flex items-center gap-2"><Badge>{data.subject}</Badge><Badge tone="accent">{data.topic}</Badge><Badge tone="outline">{data.difficulty}</Badge></div>
      </div>

      <div className="mb-5 flex items-center gap-4">
        <span className="num text-sm text-ink">{index + 1}<span className="text-faint">/{data.questions.length}</span></span>
        <div className="flex flex-1 gap-1">
          {data.questions.map((x, i) => <span key={x.id} className={cn("h-1.5 flex-1 rounded-full", graded[x.id] ? (graded[x.id].correct ? "bg-success" : "bg-danger") : i === index ? "bg-ink" : "bg-sunken")} />)}
        </div>
        <span className={cn("num flex items-center gap-1 text-sm", !result && left <= 10 ? "text-danger" : "text-muted")}><Timer className="size-4" /> {result ? "—" : `${left}s`}</span>
      </div>

      {q && (
        <Card key={q.id} className="overflow-hidden animate-rise">
          {!result && <Progress value={(left / limit) * 100} tone={left <= 10 ? "warm" : "ink"} className="h-0.5 rounded-none" />}
          <div className="p-6 sm:p-8">
            <Markdown className="text-[17px] leading-relaxed text-ink">{q.question}</Markdown>
            <ol className="mt-6 space-y-2.5">
              {q.options.map((opt, i) => {
                const isAnswer = result && i === result.answer;
                const isWrongPick = result && i === result.chosen && !result.correct;
                return (
                  <li key={i}>
                    <button type="button" disabled={!!result || busy} onClick={() => answer(i)}
                      className={cn("flex w-full items-start gap-3.5 rounded-[12px] border px-4 py-3.5 text-left text-[15px] transition-all",
                        !result && "border-line hover:border-accent hover:bg-accent-soft/40",
                        isAnswer && "border-success bg-success-soft",
                        isWrongPick && "border-danger bg-danger-soft",
                        result && !isAnswer && !isWrongPick && "border-line opacity-60")}>
                      <span className={cn("num grid size-6 shrink-0 place-items-center rounded-md border text-xs", isAnswer ? "border-success bg-success text-white" : isWrongPick ? "border-danger bg-danger text-white" : "border-line-strong text-muted")}>
                        {isAnswer ? <Check className="size-3.5" /> : isWrongPick ? <X className="size-3.5" /> : i + 1}
                      </span>
                      <span className="pt-0.5 text-ink"><Markdown className="text-[15px] text-ink [&_p]:m-0">{opt}</Markdown></span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {result ? (
              <div className="mt-6 animate-rise">
                <p className={cn("text-sm font-semibold", result.correct ? "text-success" : "text-danger")}>{result.correct ? "Correct" : result.chosen === null ? "Time's up" : "Not quite"}</p>
                <Markdown className="mt-2 rounded-[12px] bg-surface-2 p-4 text-[14px]">{result.explanation}</Markdown>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted">Score {correct}/{answered}</span>
                  <Button onClick={() => setIndex(index + 1)}>{index + 1 === data.questions.length ? "See results" : "Next question"} <ArrowRight /></Button>
                </div>
              </div>
            ) : (
              <p className="mt-6 flex items-center gap-2 text-xs text-muted">Press <Kbd>1</Kbd>–<Kbd>4</Kbd> to answer · <Kbd>Enter</Kbd> for next</p>
            )}
          </div>
        </Card>
      )}
    </div>
    )}</Countdown>
  );
}
