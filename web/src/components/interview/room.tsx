"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleStop, Loader2, Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, buttonClass, Card, CardHeader, Textarea } from "@/components/ui/primitives";
import { Meter } from "@/components/ui/charts";
import { api } from "@/lib/api";
import { cn, initials } from "@/lib/utils";

type Turn = { role: "interviewer" | "candidate"; content: string; at: string; kind?: string };
type Report = {
  overall: number; verdict: string; summary: string; dimensions: { name: string; score: number; comment: string }[];
  strengths: string[]; improvements: string[]; questions: { question: string; score: number; feedback: string; betterAnswer: string }[]; nextSteps: string[];
};
type Interview = {
  id: string; status: string; score: number | null; report: Report | null; transcript: Turn[];
  config: { role: string; company: string; subject: string; difficulty: string; type: string; questions: number; voice: boolean };
  state: { asked: number; followUps: number };
};

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  const voice = window.speechSynthesis.getVoices().find((v) => /en-(IN|GB|US)/.test(v.lang) && /female|Google|Samantha|Rishi|Veena/i.test(v.name));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function InterviewRoom({ initial }: { initial: Interview }) {
  const [iv, setIv] = useState(initial);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<"answer" | "end" | null>(null);
  const [sound, setSound] = useState(initial.config.voice);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const spokenCount = useRef(0);

  const done = iv.status === "completed";
  const interviewerName = (iv.transcript[0]?.content.match(/I'?m ([A-Z][a-z]+)/)?.[1]) ?? "Interviewer";

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    const last = iv.transcript[iv.transcript.length - 1];
    if (sound && last?.role === "interviewer" && iv.transcript.length > spokenCount.current) speak(last.content);
    spokenCount.current = iv.transcript.length;
  }, [iv.transcript, sound]);
  useEffect(() => () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }, []);

  async function send(end = false) {
    if (!end && !answer.trim()) return;
    setBusy(end ? "end" : "answer");
    const pending = answer.trim();
    if (!end) setIv((s) => ({ ...s, transcript: [...s.transcript, { role: "candidate", content: pending, at: new Date().toISOString() }] }));
    setAnswer("");
    try {
      const res = await api<{ transcript: Turn[]; status: string; report?: Report; score?: number; state: Interview["state"] }>(`/api/interview/${iv.id}/turn`, { method: "POST", json: end ? { end: true } : { answer: pending } });
      setIv((s) => ({ ...s, transcript: res.transcript, status: res.status, report: res.report ?? s.report, score: res.score ?? s.score, state: res.state ?? s.state }));
      if (res.status === "completed") toast.success("Interview complete — your report is ready. +60 XP");
    } catch (e) {
      toast.error((e as Error).message);
      if (!end) { setIv((s) => ({ ...s, transcript: s.transcript.slice(0, -1) })); setAnswer(pending); }
    } finally {
      setBusy(null);
    }
  }

  async function toggleRecording() {
    if (recording) { recorder.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }), "answer.webm");
          const { text } = await api<{ text: string }>("/api/interview/transcribe", { method: "POST", body: form });
          setAnswer((a) => (a ? `${a} ${text}` : text));
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setTranscribing(false);
        }
      };
      window.speechSynthesis?.cancel();
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone access was blocked. You can type your answer instead.");
    }
  }

  const header = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link href="/interview" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Interviews</Link>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{iv.config.company}</Badge><Badge tone="accent">{iv.config.role}</Badge><Badge tone="outline">{iv.config.type} · {iv.config.difficulty}</Badge>
        {!done && <span className="num text-xs text-muted">Question {Math.min(iv.state.asked, iv.config.questions)} of {iv.config.questions}</span>}
      </div>
    </div>
  );

  const transcript = (
    <ol className="space-y-5">
      {iv.transcript.map((t, i) => (
        <li key={i} className={cn("flex gap-3 animate-rise", t.role === "candidate" && "flex-row-reverse")}>
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold", t.role === "interviewer" ? "bg-ink text-canvas dark:bg-accent dark:text-accent-ink" : "bg-accent-soft text-accent")}>
            {t.role === "interviewer" ? initials(interviewerName) : "You"}
          </span>
          <div className={cn("max-w-[78%]", t.role === "candidate" && "text-right")}>
            <p className="mb-1 text-[11px] text-faint">{t.role === "interviewer" ? `${interviewerName} · ${iv.config.company}${t.kind === "follow_up" ? " · follow-up" : ""}` : "You"}</p>
            <div className={cn("inline-block rounded-[14px] px-4 py-3 text-left text-[15px] leading-relaxed", t.role === "interviewer" ? "rounded-tl-sm bg-surface text-ink ring-1 ring-line" : "rounded-tr-sm bg-accent-soft text-ink")}>{t.content}</div>
          </div>
        </li>
      ))}
      {busy === "answer" && (
        <li className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-canvas dark:bg-accent dark:text-accent-ink">{initials(interviewerName)}</span>
          <span className="flex items-center gap-1 rounded-[14px] bg-surface px-4 py-3 ring-1 ring-line">{[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${d * 120}ms` }} />)}</span></li>
      )}
      <div ref={bottom} />
    </ol>
  );

  if (done && iv.report) {
    const r = iv.report;
    return (
      <div className="mx-auto max-w-5xl">
        {header}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Card className="p-7 animate-rise">
            <p className="eyebrow">Panel verdict</p>
            <p className="num mt-4 text-[64px] leading-none text-ink">{Math.round(r.overall)}<span className="text-xl text-muted">/100</span></p>
            <Badge tone={/Strong|^Hire/.test(r.verdict) ? "success" : /Lean hire/.test(r.verdict) ? "accent" : "warm"} className="mt-3 text-[13px]">{r.verdict}</Badge>
            <p className="mt-5 text-[14px] leading-relaxed text-ink-2">{r.summary}</p>
            <div className="mt-6 space-y-3.5 border-t border-line pt-5">{r.dimensions.map((d) => <Meter key={d.name} label={d.name} value={d.score * 10} detail={`${d.score}/10`} />)}</div>
          </Card>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="p-5"><CardHeader title="Strengths" /><ul className="mt-3 space-y-2">{r.strengths.map((s) => <li key={s} className="flex gap-2 text-sm text-ink-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{s}</li>)}</ul></Card>
              <Card className="p-5"><CardHeader title="Work on" /><ul className="mt-3 space-y-2">{r.improvements.map((s) => <li key={s} className="flex gap-2 text-sm text-ink-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-warm" />{s}</li>)}</ul></Card>
            </div>
            <Card className="p-5">
              <CardHeader title="Question by question" />
              <ol className="mt-3 divide-y divide-line">
                {r.questions.map((q, i) => (
                  <li key={i} className="py-4">
                    <div className="flex items-start justify-between gap-4"><p className="text-[14px] font-medium text-ink">{q.question}</p><span className="num shrink-0 text-sm text-ink">{q.score}/10</span></div>
                    <p className="mt-1.5 text-[13px] text-ink-2">{q.feedback}</p>
                    <p className="mt-2 rounded-[10px] bg-surface-2 p-3 text-[13px] text-ink-2"><span className="font-medium text-accent">Stronger answer: </span>{q.betterAnswer}</p>
                  </li>
                ))}
              </ol>
            </Card>
            <Card className="p-5">
              <CardHeader title="Next steps" />
              <ul className="mt-3 space-y-2">{r.nextSteps.map((s) => <li key={s} className="text-sm text-ink-2">→ {s}</li>)}</ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/interview" className={buttonClass("primary", "sm")}>New interview</Link>
                <Link href="/practice" className={buttonClass("outline", "sm")}>Practise weak topics</Link>
              </div>
            </Card>
          </div>
        </div>
        <details className="mt-6"><summary className="cursor-pointer text-sm text-muted hover:text-ink">Full transcript</summary><Card className="mt-3 p-6">{transcript}</Card></details>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {header}
      <Card className="flex min-h-[60vh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 text-sm"><span className="size-2 animate-pulse rounded-full bg-danger" /> <span className="text-ink-2">Live interview</span></div>
          <Button variant="ghost" size="sm" onClick={() => { setSound((v) => !v); window.speechSynthesis?.cancel(); }}>{sound ? <Volume2 /> : <VolumeX />} {sound ? "Voice on" : "Voice off"}</Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin">{transcript}</div>
        <div className="border-t border-line p-4">
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={recording ? "Listening…" : "Type your answer, or use the microphone"} className="min-h-24 text-[15px]" disabled={!!busy || recording}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send(); }} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant={recording ? "danger" : "outline"} onClick={toggleRecording} disabled={!!busy || transcribing}>
                {transcribing ? <Loader2 className="animate-spin" /> : recording ? <Square /> : <Mic />}{transcribing ? "Transcribing" : recording ? "Stop" : "Speak"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => send(true)} loading={busy === "end"} disabled={!!busy}><CircleStop /> End &amp; get feedback</Button>
            </div>
            <Button onClick={() => send()} loading={busy === "answer"} disabled={!!busy || !answer.trim()}><Send /> Answer</Button>
          </div>
          <p className="mt-2 text-[11px] text-faint">⌘/Ctrl + Enter to send · Spoken answers are transcribed with Whisper on Groq</p>
        </div>
      </Card>
    </div>
  );
}
