"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Loader2,
  MessageCircle,
  Mic,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  jsonRequest,
  request,
  WorkspaceRequestError,
} from "@/components/workspace/api";
import {
  clampPercent,
  dateFormat,
  ErrorNotice,
  IconTile,
  Notice,
  Panel,
  PanelHeading,
  PercentBar,
  prettyLabel,
  selectClass,
  Tag,
  WorkspaceHeading,
} from "@/components/workspace/ui";
import type { Interview, InterviewEvaluation } from "@/types";

const topics = [
  "Data Structures & Algorithms",
  "JavaScript & TypeScript",
  "React & Modern Frontend",
  "Node.js & Backend Architecture",
  "System Design & Scalability",
  "Database Engineering & SQL",
  "Operating Systems & Concurrency",
  "Computer Networks & Protocols",
  "Object-Oriented Design & SOLID",
  "Behavioral & Engineering Leadership",
];
const levels = [
  {
    value: "easy",
    label: "Foundations",
    hint: "Core concepts and clear explanations",
  },
  {
    value: "medium",
    label: "Intermediate",
    hint: "Practical trade-offs and applied skills",
  },
  { value: "hard", label: "Advanced", hint: "Deeper reasoning and edge cases" },
];
const approach = [
  {
    title: "Frame the problem",
    description:
      "State your assumptions. Clarify inputs, constraints, and what a successful result looks like.",
  },
  {
    title: "Make your reasoning visible",
    description:
      "Explain the approach, walk through an example, and discuss alternatives before committing.",
  },
  {
    title: "Test your answer",
    description:
      "Check edge cases and failure modes. Describe complexity or the trade-offs you would measure.",
  },
];

export default function InterviewPage() {
  const {
    data: history,
    error: historyError,
    isLoading,
    mutate,
  } = useSWR("/api/interview", request<Interview[]>);
  const [active, setActive] = useState<Interview | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(
    null,
  );
  const [answer, setAnswer] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [difficulty, setDifficulty] = useState("medium");
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [historyFilter, setHistoryFilter] = useState("all");

  function open(interview: Interview | null) {
    setActive(interview);
    setAnswer("");
    setEvaluation(null);
    setFailure(null);
  }

  async function start() {
    setStarting(true);
    setFailure(null);
    try {
      const interview = await request<Interview>(
        "/api/interview",
        jsonRequest("POST", { topic, difficulty, num_questions: 5 }),
      );
      open(interview);
      void mutate();
    } catch (error) {
      setFailure(error);
    } finally {
      setStarting(false);
    }
  }

  async function submit() {
    if (!active || !answer.trim() || evaluation || submitting) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const result = await request<{
        interview: Interview;
        evaluation: InterviewEvaluation;
      }>(
        `/api/interview/${active.id}/answer`,
        jsonRequest("POST", {
          answer: answer.trim(),
          question_index: active.answers?.length ?? 0,
        }),
      );
      setEvaluation(result.evaluation);
      setActive(result.interview);
      setAnswer("");
      void mutate();
    } catch (error) {
      if (error instanceof WorkspaceRequestError && error.status === 409) {
        const refreshed = await mutate().catch(() => undefined);
        const current = refreshed?.find(
          (interview) => interview.id === active.id,
        );
        if (current) {
          setActive(current);
          if ((current.answers?.length ?? 0) > (active.answers?.length ?? 0)) {
            setAnswer("");
            setEvaluation(current.evaluations?.at(-1) ?? null);
          }
        }
      }
      setFailure(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    const count = active.questions?.length ?? 0;
    const answered = active.answers?.length ?? 0;
    const complete = active.status === "completed";
    const next = active.questions?.[answered];
    const reviewed =
      evaluation || (complete ? active.evaluations?.at(-1) : null);
    const missedTopics = [
      ...new Set(
        (active.evaluations || []).flatMap((item) => item.topics_missed || []),
      ),
    ];
    return (
      <div className="workspace-page space-y-7">
        <WorkspaceHeading
          label={complete ? "Session review" : "Interview room"}
          title={active.topic}
          description={
            complete
              ? "Keep the reasoning that worked. Make a focused plan for the gaps that remain."
              : "Take a breath, think out loud, and work through one question at a time."
          }
          actions={
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => open(null)}
            >
              <ArrowLeft />
              {complete ? "All interviews" : "Leave for now"}
            </Button>
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <Tag tone="accent">{prettyLabel(active.difficulty)} difficulty</Tag>
          <Tag>
            {answered} of {count} answered
          </Tag>
          <span className="text-sm text-muted-foreground">
            Started {dateFormat.format(new Date(active.created_at))}
          </span>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)]">
          <div className="space-y-5">
            {!!failure && <ErrorNotice error={failure} />}
            {complete ? (
              <Panel className="relative overflow-hidden">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <IconTile icon={ClipboardCheck} />
                  <Tag tone="success">Completed</Tag>
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall session score
                </p>
                <p className="mt-2 text-6xl font-semibold tracking-tight tabular-nums text-foreground">
                  {active.overall_score === null
                    ? "—"
                    : clampPercent(active.overall_score)}
                  <span className="ml-1 text-2xl font-normal text-muted-foreground">
                    / 100
                  </span>
                </p>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {active.feedback_summary ||
                    "Your full question-by-question review is saved below."}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      setTopic(active.topic);
                      setDifficulty(active.difficulty);
                      open(null);
                    }}
                  >
                    <RotateCcw />
                    Practice this topic again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("answer-review")?.scrollIntoView({
                        behavior: "instant",
                        block: "start",
                      })
                    }
                  >
                    Review answers
                    <ArrowRight />
                  </Button>
                </div>
              </Panel>
            ) : reviewed ? (
              <Panel>
                <IconTile icon={ClipboardCheck} />
                <h2 className="mt-5 text-2xl font-semibold">
                  A little feedback, then forward.
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Your answer is saved. Read the review alongside this card and
                  take one improvement into the next question.
                </p>
                <Button className="mt-6" onClick={() => setEvaluation(null)}>
                  Continue to question {answered + 1}
                  <ArrowRight />
                </Button>
              </Panel>
            ) : next ? (
              <Panel>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <Tag tone="accent">
                    Question {answered + 1} of {count}
                  </Tag>
                  <Tag>{prettyLabel(next.type)}</Tag>
                </div>
                <h2 className="mb-7 whitespace-pre-wrap break-words text-xl font-semibold leading-relaxed sm:text-2xl">
                  {next.question}
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                  }}
                >
                  <label className="grid gap-3 text-sm font-medium">
                    Your answer
                    <Textarea
                      rows={10}
                      maxLength={20000}
                      placeholder="Start with your understanding of the problem, then explain your approach and trade-offs…"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      className="leading-relaxed"
                    />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {answer.length.toLocaleString()} / 20,000 characters
                    </span>
                    <Button
                      type="submit"
                      disabled={!answer.trim() || submitting}
                    >
                      {submitting ? (
                        <Loader2 className="motion-safe:animate-spin" />
                      ) : (
                        <ArrowRight />
                      )}
                      {submitting
                        ? "Reviewing your answer…"
                        : "Submit for feedback"}
                    </Button>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Your answer is saved when you submit it.
                  </p>
                </form>
              </Panel>
            ) : (
              <Panel>
                <Notice
                  title="This session cannot continue"
                  description="Return to your interview history and start a new session."
                />
              </Panel>
            )}
            {(complete || answered > 0) && (
              <Panel>
                <div id="answer-review" className="scroll-mt-24">
                  <PanelHeading
                    title="Your answer notebook"
                    description="Revisit each question, your submitted answer, and the feedback it received."
                  />
                  <AnswerReview interview={active} />
                </div>
              </Panel>
            )}
          </div>
          <aside className="space-y-5">
            <Panel>
              <PanelHeading
                title={complete ? "Session at a glance" : "Your progress"}
                action={<IconTile icon={Target} />}
              />
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Questions answered
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {answered}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {count}
                  </span>
                </p>
              </div>
              <PercentBar
                label="Questions answered"
                value={count ? (100 * answered) / count : 0}
              />
              <ol
                className="mt-5 flex flex-wrap gap-2"
                aria-label="Question progress"
              >
                {(active.questions || []).map((question, index) => (
                  <li
                    key={question.id}
                    aria-label={`Question ${index + 1}, ${index < answered ? "answered" : "upcoming"}`}
                    className={`grid size-10 place-items-center rounded-full border text-sm font-medium ${index < answered ? "border-primary/20 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {index < answered ? (
                      <Check className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </li>
                ))}
              </ol>
            </Panel>
            {reviewed ? (
              <Panel>
                <Evaluation
                  evaluation={reviewed}
                  title={complete ? "Final answer feedback" : "Answer feedback"}
                />
              </Panel>
            ) : (
              <Panel>
                <PanelHeading title="A useful answer includes" />
                <ol className="space-y-5">
                  {approach.map((item, index) => (
                    <li key={item.title} className="flex gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-xs text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
            {complete && missedTopics.length > 0 && (
              <Panel>
                <PanelHeading
                  title="Your next practice list"
                  description="Topics flagged in this session’s feedback."
                />
                <div className="flex flex-wrap gap-2">
                  {missedTopics.map((item) => (
                    <Tag key={item} tone="warning">
                      {item}
                    </Tag>
                  ))}
                </div>
              </Panel>
            )}
          </aside>
        </div>
      </div>
    );
  }

  const sessions = history || [];
  const completed = sessions.filter(
    (interview) => interview.status === "completed",
  );
  const saved = sessions.filter(
    (interview) => interview.status !== "completed",
  );
  const scored = completed.filter(
    (interview) => interview.overall_score !== null,
  );
  const average = scored.length
    ? Math.round(
        scored.reduce(
          (total, interview) => total + (interview.overall_score || 0),
          0,
        ) / scored.length,
      )
    : null;
  const filtered = sessions.filter(
    (interview) =>
      historyFilter === "all" ||
      (historyFilter === "completed"
        ? interview.status === "completed"
        : interview.status !== "completed"),
  );

  return (
    <div className="workspace-page space-y-7">
      <WorkspaceHeading
        label="Interview studio"
        title="Turn practice into presence."
        description="Build the confidence to explain your thinking. Choose a focused round, get specific feedback, and come back stronger."
        actions={
          <Tag tone="accent">
            <Mic className="mr-1.5 size-3.5" />
            Written practice rounds
          </Tag>
        }
      />
      <Panel className="!py-0">
        <dl className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            [
              "Completed rounds",
              isLoading ? "…" : String(completed.length),
              "A saved record of your practice",
            ],
            [
              "Average session score",
              isLoading ? "…" : average === null ? "—" : `${average} / 100`,
              "Across your scored, completed sessions",
            ],
            [
              "Ready to resume",
              isLoading ? "…" : String(saved.length),
              "Pick up after your last saved answer",
            ],
          ].map(([label, value, description]) => (
            <div key={label} className="py-5 sm:px-5 first:sm:pl-0">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1.5">
                <span className="block text-3xl font-semibold tracking-tight tabular-nums">
                  {value}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {description}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Panel>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,1fr)]">
        <Panel>
          <PanelHeading
            title="Build your next round"
            description="Five questions, one focus area, and feedback after every answer."
            action={<IconTile icon={Mic} />}
          />
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void start();
            }}
          >
            <label className="grid gap-2 text-sm font-medium">
              What would you like to practice?
              <select
                className={selectClass}
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                {topics.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">
                Choose your challenge
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {levels.map(({ value, label, hint }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer gap-2.5 rounded-2xl border p-4 text-sm transition-colors ${value === difficulty ? "border-primary/30 bg-primary/8" : "border-border bg-background/30"}`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={value}
                      checked={value === difficulty}
                      onChange={() => setDifficulty(value)}
                      className="mt-1 shrink-0 accent-primary"
                    />
                    <span>
                      <span className="block font-semibold">{label}</span>
                      <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                        {hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Tag>5 questions</Tag>
              <Tag>Individual feedback</Tag>
              <Tag>Resume anytime</Tag>
            </div>
            {!!failure && <ErrorNotice error={failure} />}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Answers are saved as you submit. Work at your own pace.
              </p>
              <Button type="submit" disabled={starting}>
                {starting ? (
                  <Loader2 className="motion-safe:animate-spin" />
                ) : (
                  <Play />
                )}
                {starting ? "Preparing your round…" : "Enter interview room"}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel>
          <PanelHeading
            title="Before you begin"
            description="A simple structure for a thoughtful answer."
            action={<IconTile icon={BookOpen} />}
          />
          <ol className="space-y-6">
            {approach.map((item, index) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/7 text-sm font-medium text-primary">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            Feedback highlights covered topics, missing ideas, and one concrete
            improvement. Treat it as a guide for your next attempt.
          </p>
        </Panel>
      </div>
      <Panel>
        <PanelHeading
          title="Your practice archive"
          description="Continue a saved round or study the full feedback from a completed session."
          action={<IconTile icon={Clock} />}
        />
        <div
          className="mb-5 flex flex-wrap gap-2"
          aria-label="Filter interviews"
        >
          {[
            ["all", "All rounds"],
            ["saved", "In progress"],
            ["completed", "Completed"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={historyFilter === value ? "default" : "outline"}
              size="sm"
              aria-pressed={historyFilter === value}
              onClick={() => setHistoryFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        {historyError && (
          <ErrorNotice error={historyError} retry={() => void mutate()} />
        )}
        {isLoading ? (
          <p className="py-8 text-sm text-muted-foreground" role="status">
            Loading your interviews…
          </p>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[630px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                  <th scope="col" className="pb-3 font-medium">
                    Focus area
                  </th>
                  <th scope="col" className="pb-3 font-medium">
                    Level
                  </th>
                  <th scope="col" className="pb-3 font-medium">
                    Progress
                  </th>
                  <th scope="col" className="pb-3 font-medium">
                    Result
                  </th>
                  <th scope="col" className="pb-3 text-right font-medium">
                    Review
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((interview) => {
                  const complete = interview.status === "completed";
                  return (
                    <tr
                      key={interview.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <th
                        scope="row"
                        className="max-w-72 py-5 pr-4 font-medium"
                      >
                        <span className="block">{interview.topic}</span>
                        <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                          {dateFormat.format(new Date(interview.created_at))}
                        </span>
                      </th>
                      <td className="pr-4">
                        {levels.find(
                          (level) => level.value === interview.difficulty,
                        )?.label || prettyLabel(interview.difficulty)}
                      </td>
                      <td className="pr-4">
                        <Tag tone={complete ? "success" : "neutral"}>
                          {complete
                            ? "Completed"
                            : `${interview.answers?.length ?? 0}/${interview.questions?.length ?? 0} answered`}
                        </Tag>
                      </td>
                      <td className="pr-4 font-medium tabular-nums">
                        {complete && interview.overall_score !== null
                          ? `${clampPercent(interview.overall_score)} / 100`
                          : "—"}
                      </td>
                      <td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => open(interview)}
                        >
                          {complete ? "Review" : "Resume"}
                          <ArrowRight />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !historyError && (
            <Notice
              icon={MessageCircle}
              title={
                sessions.length
                  ? "No rounds in this view"
                  : "Your first round starts a habit"
              }
              description={
                sessions.length
                  ? "Try another filter to find your saved interviews."
                  : "Choose a topic above. Your questions, answers, and feedback will stay here so you can see what to practice next."
              }
            />
          )
        )}
      </Panel>
    </div>
  );
}

function AnswerReview({ interview }: { interview: Interview }) {
  return (
    <div className="space-y-3">
      {(interview.evaluations || []).map((item, index) => (
        <details
          key={index}
          className="group rounded-2xl border border-border bg-background/20"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <span className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/8 text-sm text-primary">
                {index + 1}
              </span>
              <span className="text-sm font-medium">
                {prettyLabel(interview.questions?.[index]?.type) ||
                  "Interview question"}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.score}/{item.max_score || 10} · Answer saved
                </span>
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-5 border-t border-border p-4 sm:p-5">
            {interview.questions?.[index]?.question && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">The question</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {interview.questions[index].question}
                </p>
              </div>
            )}
            {interview.answers?.[index] && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Your answer</h3>
                <p className="whitespace-pre-wrap break-words rounded-xl border border-border bg-background/35 p-4 text-sm leading-relaxed">
                  {interview.answers[index]}
                </p>
              </div>
            )}
            <Evaluation evaluation={item} title="Mentor feedback" />
          </div>
        </details>
      ))}
    </div>
  );
}

function Evaluation({
  evaluation,
  title,
}: {
  evaluation: InterviewEvaluation;
  title?: string;
}) {
  return (
    <div className="space-y-5">
      {title && (
        <PanelHeading
          title={title}
          action={
            <Tag tone="accent">
              {evaluation.score}/{evaluation.max_score || 10}
            </Tag>
          }
        />
      )}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {evaluation.feedback}
      </p>
      {!!evaluation.topics_covered?.length && (
        <div>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold">
            <Check className="size-4 text-primary" />
            What came through
          </h3>
          <div className="flex flex-wrap gap-2">
            {evaluation.topics_covered.map((topic, index) => (
              <Tag key={index} tone="success">
                {topic}
              </Tag>
            ))}
          </div>
        </div>
      )}
      {!!evaluation.topics_missed?.length && (
        <div>
          <h3 className="mb-2.5 text-sm font-semibold">Worth another look</h3>
          <div className="flex flex-wrap gap-2">
            {evaluation.topics_missed.map((topic, index) => (
              <Tag key={index} tone="warning">
                {topic}
              </Tag>
            ))}
          </div>
        </div>
      )}
      {evaluation.improvement_tip && (
        <div className="rounded-2xl border border-primary/12 bg-primary/6 p-4">
          <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" />
            Take this into your next answer
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {evaluation.improvement_tip}
          </p>
        </div>
      )}
    </div>
  );
}
