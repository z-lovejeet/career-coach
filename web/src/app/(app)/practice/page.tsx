"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowRight, Clock, GraduationCap, Timer } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardHeader, PageHeader, Segmented, Skeleton } from "@/components/ui/primitives";
import { api, fetcher } from "@/lib/api";
import { findSubject, SECONDS_PER_QUESTION, SUBJECTS } from "@/lib/subjects";
import { cn, timeAgo } from "@/lib/utils";

type Stats = Record<string, { correct: number; answered: number }>;
type SessionRow = { id: string; subject: string; topic: string; difficulty: string; correct: number; total: number; answered: number; status: string; started_at: string };

function PracticeHome() {
  const params = useSearchParams();
  const router = useRouter();
  const { data } = useSWR<{ sessions: SessionRow[]; stats: Stats }>("/api/practice", fetcher);
  const initial = findSubject(params.get("subject") ?? "") ?? SUBJECTS[0];
  const [group, setGroup] = useState<"academic" | "placement">(initial.group);
  const [subjectId, setSubjectId] = useState(initial.id);
  const [topic, setTopic] = useState<string | null>(params.get("topic"));
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState("10");
  const [starting, setStarting] = useState(false);

  const subject = SUBJECTS.find((s) => s.id === subjectId)!;

  const accuracy = useMemo(() => (t: string) => {
    const s = data?.stats[`${subject.name}::${t}`];
    return s && s.answered ? Math.round((s.correct / s.answered) * 100) : null;
  }, [data, subject]);

  async function start() {
    if (!topic) return toast.error("Pick a topic first.");
    setStarting(true);
    try {
      const res = await api<{ id: string; generated: number }>("/api/practice/start", { method: "POST", json: { subject: subject.id, topic, difficulty, count: Number(count) } });
      if (res.generated) toast.success(`${res.generated} new questions written by the Question Setter agent.`);
      router.push(`/practice/${res.id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setStarting(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Practice" title="Real-time practice" description="Timed questions on university subjects and placement-test sections. Every answer is graded instantly with an explanation, and your weak topics feed back into your dashboard and roadmap." />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Segmented value={group} onChange={(g) => { setGroup(g); setSubjectId(SUBJECTS.find((s) => s.group === g)!.id); setTopic(null); }} options={[{ value: "academic", label: "Academic subjects" }, { value: "placement", label: "Placement preparation" }]} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SUBJECTS.filter((s) => s.group === group).map((s) => (
              <button key={s.id} type="button" onClick={() => { setSubjectId(s.id); setTopic(null); }}
                className={cn("rounded-[12px] border p-4 text-left transition-all", s.id === subjectId ? "border-accent bg-surface ring-1 ring-accent shadow-card" : "border-line bg-surface hover:border-line-strong")}>
                <span className="block text-[14px] font-semibold leading-snug text-ink">{s.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{s.blurb}</span>
              </button>
            ))}
          </div>

          <Card className="p-6">
            <CardHeader title={subject.name} description="Choose a topic. Your accuracy so far is shown on each one." />
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subject.topics.map((t) => {
                const acc = accuracy(t);
                return (
                  <button key={t} type="button" onClick={() => setTopic(t)}
                    className={cn("flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3 text-left text-[14px] transition-all", topic === t ? "border-accent bg-accent-soft/60 text-ink ring-1 ring-accent" : "border-line text-ink-2 hover:border-line-strong")}>
                    <span className="truncate">{t}</span>
                    {acc !== null && <span className={cn("num shrink-0 text-xs", acc < 60 ? "text-warm" : "text-success")}>{acc}%</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-5 border-t border-line pt-5">
              <div className="flex flex-wrap gap-6">
                <div><p className="mb-2 text-xs font-medium text-muted">Difficulty</p><Segmented size="sm" value={difficulty} onChange={setDifficulty} options={[{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]} /></div>
                <div><p className="mb-2 text-xs font-medium text-muted">Questions</p><Segmented size="sm" value={count} onChange={setCount} options={[{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "15", label: "15" }]} /></div>
                <div className="flex items-center gap-1.5 self-end pb-1 text-xs text-muted"><Timer className="size-3.5" /> {SECONDS_PER_QUESTION[difficulty]}s per question</div>
              </div>
              <Button size="lg" onClick={start} loading={starting} disabled={!topic}>Start session <ArrowRight /></Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
        <Card className="p-5">
          <CardHeader title="Recent sessions" />
          {!data ? <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div> : data.sessions.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.sessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/practice/${s.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                    <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-ink">{s.topic}</span><span className="block text-xs text-muted">{s.subject.split(" ")[0]} · {s.difficulty} · {timeAgo(s.started_at)}</span></span>
                    {s.status === "completed" ? <span className="num text-sm text-ink">{s.correct}/{s.total}</span> : <Badge tone="warm"><Clock /> {s.answered}/{s.total}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 flex items-start gap-2 text-sm text-muted"><GraduationCap className="mt-0.5 size-4 shrink-0" /> Your sessions will appear here.</p>}
        </Card>
        <Card className="p-5">
          <CardHeader title="How practice works" />
          <ul className="mt-4 space-y-3.5 text-[13px] leading-relaxed text-ink-2">
            <li><span className="font-medium text-ink">Timed like the real thing.</span> Each question has a clock — 45 s easy, 75 s medium, 120 s hard. Running out counts as a miss.</li>
            <li><span className="font-medium text-ink">Graded on the server.</span> Answers stay hidden until you commit, then you get the correct option and a worked explanation.</li>
            <li><span className="font-medium text-ink">Always new questions.</span> You&apos;re served questions you haven&apos;t seen first; when the bank runs low, the Question Setter agent writes more.</li>
            <li><span className="font-medium text-ink">It feeds your plan.</span> Topic accuracy appears on your dashboard, lowers or raises readiness, and shapes the roadmap&apos;s suggestions.</li>
          </ul>
        </Card>
        </div>
      </div>
    </>
  );
}

export default function PracticePage() {
  return <Suspense><PracticeHome /></Suspense>;
}
