"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowUp, Database, MessageCircle, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Textarea } from "@/components/ui/primitives";
import { CompassMark } from "@/components/brand";
import { Markdown } from "@/components/markdown";
import { api, fetcher, readNDJSON } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";

type Thread = { id: string; title: string; updated_at: string };
type Tool = { name: string; label: string; query?: string };
type Message = { id?: string; role: "user" | "assistant"; content: string; meta?: { model?: string; tools?: Tool[] } };

const STARTERS = [
  "Based on my progress, what should I focus on this week?",
  "Compare Data Scientist and Machine Learning Engineer careers for me",
  "Explain virtual memory and paging with a simple example",
  "How should I prepare for product-company placements in 3 months?",
  "Is an M.Tech worth it for my goals, or should I take a job?",
  "Which careers fit someone who loves maths and research?",
];

function Mentor() {
  const params = useSearchParams();
  const { data: threads, mutate: refreshThreads } = useSWR<Thread[]>("/api/mentor", fetcher);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(params.get("q") ?? "");
  const [streaming, setStreaming] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" }); }, [messages, streaming]);

  async function open(id: string) {
    if (streaming) return;
    setThreadId(id);
    const t = await api<{ messages: Message[] }>(`/api/mentor/${id}`);
    setMessages(t.messages);
  }

  async function remove(id: string) {
    await api(`/api/mentor/${id}`, { method: "DELETE" });
    if (id === threadId) { setThreadId(null); setMessages([]); }
    void refreshThreads();
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setInput("");
    setStreaming(true);
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "", meta: { tools: [] } }]);
    const patchLast = (fn: (m: Message) => Message) => setMessages((list) => [...list.slice(0, -1), fn(list[list.length - 1])]);
    try {
      const response = await fetch("/api/mentor/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: threadId ?? undefined, message }) });
      await readNDJSON(response, (e) => {
        if (e.type === "meta") { setThreadId(e.threadId as string); patchLast((m) => ({ ...m, meta: { model: e.model as string, tools: e.tools as Tool[] } })); }
        if (e.type === "delta") patchLast((m) => ({ ...m, content: m.content + (e.text as string) }));
        if (e.type === "error") { if (e.threadId) setThreadId(e.threadId as string); throw new Error(e.message as string); }
      });
      void refreshThreads();
    } catch (err) {
      toast.error((err as Error).message);
      setMessages((list) => list.at(-1)?.content ? list : list.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="-my-8 grid h-[calc(100dvh-4rem)] gap-0 lg:-my-11 lg:h-dvh lg:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col border-r border-line py-8 pr-4 lg:flex">
        <Button variant="outline" className="w-full justify-start" onClick={() => { setThreadId(null); setMessages([]); }}><Plus /> New conversation</Button>
        <p className="eyebrow mb-2 mt-6 px-2">History</p>
        <ul className="-mr-2 flex-1 space-y-0.5 overflow-y-auto pr-2 scrollbar-thin">
          {threads?.map((t) => (
            <li key={t.id} className="group relative">
              <button onClick={() => open(t.id)} className={cn("w-full rounded-[9px] px-2.5 py-2 text-left transition-colors", t.id === threadId ? "bg-surface ring-1 ring-line" : "hover:bg-sunken")}>
                <span className="block truncate pr-5 text-[13px] text-ink">{t.title}</span>
                <span className="block text-[11px] text-faint">{timeAgo(t.updated_at)}</span>
              </button>
              <button onClick={() => remove(t.id)} aria-label="Delete conversation" className="absolute right-1.5 top-2.5 rounded p-1 text-faint opacity-0 hover:text-danger group-hover:opacity-100"><Trash2 className="size-3.5" /></button>
            </li>
          ))}
          {threads && !threads.length && <li className="px-2 text-xs text-muted">No conversations yet.</li>}
        </ul>
      </aside>

      <section className="flex min-h-0 flex-col lg:pl-8">
        <div className="flex-1 overflow-y-auto py-8 scrollbar-thin">
          {!messages.length ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center animate-rise">
              <CompassMark className="size-12 text-ink" />
              <h1 className="display mt-5 text-[36px] leading-tight text-ink">Ask your mentor anything</h1>
              <p className="mt-2 max-w-md text-[15px] text-muted">Career choices, placements, higher studies, or any CS subject. The mentor checks O*NET, your career matches, progress and roadmap before it answers.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                {["O*NET career data", "Career search", "Your career matches", "Your progress", "Your roadmap"].map((t) => <Badge key={t} tone="outline"><Database /> {t}</Badge>)}
              </div>
              <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-[12px] border border-line bg-surface px-4 py-3 text-left text-[13.5px] text-ink-2 transition-all hover:-translate-y-0.5 hover:border-accent-line hover:text-ink">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="mx-auto max-w-3xl space-y-7">
              {messages.map((m, i) => (
                <li key={m.id ?? i} className={cn("animate-rise", m.role === "user" && "flex justify-end")}>
                  {m.role === "user" ? (
                    <div className="max-w-[80%] rounded-[16px] rounded-tr-sm bg-ink px-4 py-3 text-[15px] leading-relaxed text-canvas dark:bg-accent-soft dark:text-ink">{m.content}</div>
                  ) : (
                    <div className="flex gap-3.5">
                      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface"><CompassMark className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        {!!m.meta?.tools?.length && (
                          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-faint"><Wrench className="size-3" /> Checked</span>
                            {m.meta.tools.map((t, k) => <Badge key={k} tone="accent"><Database /> {t.label}{t.query ? `: ${t.query}` : ""}</Badge>)}
                          </div>
                        )}
                        {m.content ? <Markdown>{m.content}</Markdown> : (
                          <span className="flex items-center gap-1 py-2">{[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${d * 120}ms` }} />)}</span>
                        )}
                        {m.meta?.model && m.content && !streaming && <p className="mt-2 text-[11px] text-faint">{m.meta.model.replace("openai/", "")}</p>}
                      </div>
                    </div>
                  )}
                </li>
              ))}
              <div ref={bottom} />
            </ol>
          )}
        </div>

        <form className="mx-auto w-full max-w-3xl pb-6" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <div className="card flex items-end gap-2 p-2 focus-within:ring-4 focus-within:ring-[var(--ring)]">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about careers, placements or any subject…" rows={1}
              className="max-h-48 min-h-11 flex-1 resize-none border-0 bg-transparent py-2.5 shadow-none focus:ring-0"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }} />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()} aria-label="Send"><ArrowUp /></Button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-faint"><MessageCircle className="size-3" /> Shift + Enter for a new line · answers can be wrong, verify important decisions</p>
        </form>
      </section>
    </div>
  );
}

export default function MentorPage() {
  return <Suspense><Mentor /></Suspense>;
}
