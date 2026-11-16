"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  Code2,
  Copy,
  Lightbulb,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  jsonRequest,
  optionalRequest,
  request,
} from "@/components/workspace/api";
import {
  ErrorNotice,
  IconTile,
  Panel,
  PanelHeading,
  prettyLabel,
  Tag,
  WorkspaceHeading,
} from "@/components/workspace/ui";
import type { Analysis, ChatMessage, ChatOutput, Profile } from "@/types";

const starters = [
  {
    title: "Find my next focus",
    description: "Turn your current skills into a useful practice priority.",
    icon: Target,
    prompt:
      "What is one skill I should focus on this week, given my current profile? Explain why and give me one practical exercise.",
  },
  {
    title: "Work through a problem",
    description: "Start with a hint and build up your own solution.",
    icon: Code2,
    prompt:
      "Give me one coding interview problem at my level. Coach me through it with one hint at a time and let me attempt it before showing a solution.",
  },
  {
    title: "Make a study plan",
    description: "Break a bigger goal into a manageable daily routine.",
    icon: BookOpen,
    prompt:
      "Help me design a realistic study routine around my career goals. Ask about my available time before suggesting a schedule.",
  },
  {
    title: "Explain a trade-off",
    description: "Understand when an approach works and when it fails.",
    icon: Lightbulb,
    prompt:
      "Pick an important trade-off relevant to my skills. Explain it with a concrete example, then ask me a question to check my understanding.",
  },
];
const messageLimit = 8000;
type Message = Pick<ChatMessage, "id" | "role" | "content">;

export default function ChatPage() {
  const {
    data: history,
    error,
    isLoading,
    mutate,
  } = useSWR("/api/chat", request<Message[]>, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const { data: profile, error: profileError } = useSWR(
    "/api/profile",
    optionalRequest<Profile>,
  );
  const { data: analysis, error: analysisError } = useSWR(
    "/api/analyze/latest",
    optionalRequest<Analysis>,
  );
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [suggestions, setSuggestions] = useState<
    ChatOutput["suggested_actions"]
  >([]);
  const [sendError, setSendError] = useState<unknown>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const reducedMotion = useReducedMotion();

  const messages = history ?? [];
  const blocked = isLoading || history === undefined || !!pendingMessage;
  const questionsAsked = messages.filter(
    (message) => message.role === "user",
  ).length;

  useEffect(() => {
    const area = transcript.current;
    if (area)
      area.scrollTo({
        top: area.scrollHeight,
        behavior: reducedMotion ? "auto" : "smooth",
      });
  }, [history, pendingMessage, reducedMotion]);

  async function send(text = input) {
    const message = text.trim();
    if (!message || message.length > messageLimit || blocked || busy.current)
      return;
    busy.current = true;
    setPendingMessage(message);
    setInput("");
    setSuggestions([]);
    setSendError(null);
    try {
      const data = await request<ChatOutput>(
        "/api/chat",
        jsonRequest("POST", { message }),
      );
      const id = crypto.randomUUID();
      await mutate(
        (current = []) => [
          ...current,
          { id: `${id}-question`, role: "user", content: message },
          { id: `${id}-reply`, role: "assistant", content: data.response },
        ],
        { revalidate: false },
      );
      setSuggestions(
        Array.isArray(data.suggested_actions)
          ? data.suggested_actions.filter(
              (suggestion) =>
                typeof suggestion?.text === "string" &&
                typeof suggestion.action === "string",
            )
          : [],
      );
    } catch (failure) {
      setSendError(failure);
      setInput((current) => current || message);
      void mutate();
    } finally {
      setPendingMessage("");
      busy.current = false;
    }
  }

  return (
    <div className="workspace-page space-y-7">
      <WorkspaceHeading
        label="Your personal mentor"
        title="A clearer next step starts here."
        description="Bring a question, a tricky problem, or a big ambition. Work through it in a conversation that grows with your practice."
        actions={
          <Button variant="outline" onClick={() => composer.current?.focus()}>
            <MessageCircle />
            Ask a question
          </Button>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <Panel className="overflow-hidden !p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <IconTile icon={Sparkles} />
              <div>
                <h2 className="text-lg font-semibold">Your mentor space</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  One conversation. Your own pace.
                </p>
              </div>
            </div>
            <Tag>
              {pendingMessage
                ? "Thinking through your question"
                : `${questionsAsked} ${questionsAsked === 1 ? "question" : "questions"} explored`}
            </Tag>
          </div>
          <div
            ref={transcript}
            className="flex min-h-[380px] flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-7"
            style={{ maxHeight: "min(66dvh, 740px)" }}
            role="log"
            aria-label="Conversation with your mentor"
            aria-busy={!!pendingMessage}
          >
            {error && !history && (
              <ErrorNotice error={error} retry={() => void mutate()} />
            )}
            {isLoading && (
              <p className="text-sm text-muted-foreground" role="status">
                Opening your conversation…
              </p>
            )}
            {!messages.length && !pendingMessage && !isLoading && history && (
              <div className="my-auto py-5">
                <span className="grid size-14 place-items-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
                  <MessageCircle className="size-7" />
                </span>
                <h3 className="mt-6 max-w-sm text-3xl font-semibold tracking-tight">
                  What are you working through?
                </h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
                  You don’t need a perfectly formed question. Start with where
                  you’re stuck, and build from there.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {starters.slice(0, 2).map((starter) => (
                    <button
                      type="button"
                      key={starter.title}
                      disabled={blocked}
                      className="group flex items-start gap-3 rounded-2xl border border-border bg-background/20 p-4 text-left transition-colors hover:border-primary/25 hover:bg-primary/5 disabled:opacity-50"
                      onClick={() => void send(starter.prompt)}
                    >
                      <starter.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {starter.title}
                        </span>
                        <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                          {starter.description}
                        </span>
                      </span>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <MessageRow key={message.id} message={message} />
            ))}
            {pendingMessage && (
              <>
                <MessageRow
                  message={{
                    id: "pending",
                    role: "user",
                    content: pendingMessage,
                  }}
                />
                <div className="flex items-center gap-3 pl-1" role="status">
                  <IconTile icon={Sparkles} className="size-8 rounded-xl" />
                  <Loader2 className="size-4 text-primary motion-safe:animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Putting together a thoughtful reply…
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="space-y-4 border-t border-border bg-background/20 p-4 sm:px-7 sm:py-5">
            {!!suggestions?.length && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    disabled={blocked}
                    onClick={() =>
                      void send(suggestion.action || suggestion.text)
                    }
                  >
                    {suggestion.text}
                    <ArrowRight />
                  </Button>
                ))}
              </div>
            )}
            {!!sendError && <ErrorNotice error={sendError} />}
            <form
              className="rounded-2xl border border-border bg-background/35 p-2 transition-colors focus-within:border-primary/35"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <label className="block">
                <span className="sr-only">Message to your mentor</span>
                <Textarea
                  ref={composer}
                  rows={3}
                  placeholder="Share your question, code, or what you’ve tried so far…"
                  value={input}
                  maxLength={messageLimit}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  className="min-h-24 resize-y border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {input.length.toLocaleString()} / 8,000
                </span>
                <Button
                  type="submit"
                  aria-label="Send message to your mentor"
                  disabled={blocked || !input.trim()}
                >
                  {pendingMessage ? (
                    <Loader2 className="motion-safe:animate-spin" />
                  ) : (
                    <ArrowUp />
                  )}
                  Send message
                </Button>
              </div>
            </form>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Enter to send · Shift + Enter for a new line · Your conversation
              is saved to your account.
            </p>
          </div>
        </Panel>
        <aside className="space-y-5">
          <Panel>
            <PanelHeading
              title="Your starting point"
              description="The skills and goals in your profile help shape the conversation."
              action={<IconTile icon={Target} />}
            />
            {profileError ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your profile could not be loaded here. You can still share the
                context in your message.
              </p>
            ) : profile === undefined ? (
              <p className="text-sm text-muted-foreground" role="status">
                Loading your profile…
              </p>
            ) : (
              <>
                <div className="mb-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Working toward
                  </p>
                  <p className="mt-1.5 text-lg font-semibold">
                    {profile?.preferred_role || "Your next career opportunity"}
                  </p>
                </div>
                {profile?.skills?.length ? (
                  <div>
                    <p className="mb-2.5 text-sm font-medium">Your skill set</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 8).map((skill) => (
                        <Tag key={skill}>{skill}</Tag>
                      ))}
                      {profile.skills.length > 8 && (
                        <Tag>+{profile.skills.length - 8} more</Tag>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Add a few skills to your profile to make future practice
                    more relevant.
                  </p>
                )}
                {!!profile?.goals?.length && (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium">Career interests</p>
                    <ul className="space-y-2">
                      {profile.goals.slice(0, 3).map((goal) => (
                        <li
                          key={goal}
                          className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                        >
                          <ArrowRight className="mt-1 size-3.5 shrink-0 text-primary" />
                          {prettyLabel(goal)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {!analysisError && analysis && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-medium">Latest profile assessment</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Readiness score{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {analysis.readiness_score}/100
                  </span>
                </p>
              </div>
            )}
            <Link
              href="/profile"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Review your profile
              <ArrowRight className="size-4" />
            </Link>
          </Panel>
          <Panel>
            <PanelHeading
              title="Choose a way forward"
              description="A starting prompt for the kind of help you need."
            />
            <div className="space-y-2">
              {starters.map(({ title, description, icon: Icon, prompt }) => (
                <button
                  type="button"
                  key={title}
                  disabled={blocked}
                  onClick={() => void send(prompt)}
                  className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-primary/5 disabled:opacity-50"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </span>
                  </span>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </Panel>
          <div className="flex gap-3 px-2 pb-3">
            <Send className="mt-1 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              A useful question includes your goal, the constraint you’re
              facing, and the part you’ve already tried.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  const user = message.role === "user";
  return (
    <div
      className={`flex min-w-0 items-start gap-2.5 sm:gap-3 ${user ? "justify-end" : ""}`}
    >
      {!user && (
        <IconTile icon={Sparkles} className="size-8 rounded-xl sm:size-10" />
      )}
      <div
        className={`min-w-0 max-w-full rounded-[20px] border px-4 py-4 text-sm leading-relaxed sm:max-w-[88%] ${user ? "border-primary/12 bg-primary/8" : "border-border bg-background/35"}`}
      >
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {user ? "You" : "Your mentor"}
        </p>
        {user ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="break-words [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/25 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-primary/7 [&_code]:px-1 [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown
              components={{
                pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const pre = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pre.current?.textContent || "");
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-background/50">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Code2 className="size-3.5" />
          Code example
        </span>
        <Button variant="ghost" size="sm" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>
      {copyError && (
        <p className="px-3 text-xs text-destructive" role="status">
          Copy is unavailable. You can still select the code.
        </p>
      )}
      <pre
        ref={pre}
        className="overflow-x-auto px-4 py-4 text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0"
      >
        {children}
      </pre>
    </div>
  );
}
