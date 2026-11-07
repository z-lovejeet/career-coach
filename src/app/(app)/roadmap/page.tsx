"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Flag,
  Layers3,
  Loader2,
  Map,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  jsonRequest,
  optionalRequest,
  request,
} from "@/components/workspace/api";
import {
  ActionLink,
  clampPercent,
  ErrorNotice,
  IconTile,
  Notice,
  Panel,
  PanelHeading,
  PercentBar,
  prettyLabel,
  safeHttpUrl,
  Tag,
  WorkspaceHeading,
  WorkspaceSkeleton,
} from "@/components/workspace/ui";

interface Settings {
  dreamCompany: string;
  targetRole: string;
  timelineMonths: number;
  hoursPerDay: number;
  focusAreas: string[];
}

interface Roadmap {
  settings?: Settings;
  overview?: {
    feasibility?: string;
    feasibilityNote?: string;
    alternativeCompanies?: string[];
    currentReadiness?: number;
    targetReadiness?: number;
    estimatedFinalReadiness?: number;
  };
  phases: Array<{
    phaseNumber: number;
    title: string;
    startWeek: number;
    endWeek: number;
    objective?: string;
    milestone?: string;
    resources?: {
      title: string;
      url?: string;
      type?: string;
      description?: string;
    }[];
    weeks?: {
      weekNumber: number;
      focus: string;
      weeklyGoal?: string;
      dailyHoursBreakdown?: {
        theory: number;
        practice: number;
        projects: number;
      };
      tasks?: {
        title: string;
        description?: string;
        deliverable?: string;
        type?: string;
        resources?: string[];
      }[];
    }[];
  }>;
  keySkillsToAcquire?: {
    skill: string;
    currentLevel?: string;
    targetLevel?: string;
    estimatedWeeks?: number;
    priority?: string;
  }[];
  interviewPrep?: {
    dsaProblemsTarget?: number;
    systemDesignTopics?: string[];
    mockInterviewsTarget?: number;
    companySpecificTips?: string[];
  };
  warnings?: string[];
}

const initialSettings: Settings = {
  dreamCompany: "",
  targetRole: "Software Engineer",
  timelineMonths: 3,
  hoursPerDay: 4,
  focusAreas: ["dsa", "web_dev"],
};
const focusOptions = [
  {
    id: "dsa",
    label: "Algorithms",
    description: "Patterns, reasoning, and timed problem solving.",
  },
  {
    id: "web_dev",
    label: "Web development",
    description: "Build accessible, reliable applications.",
  },
  {
    id: "system_design",
    label: "System design",
    description: "Architecture, scale, and trade-offs.",
  },
  {
    id: "projects",
    label: "Portfolio",
    description: "Turn your knowledge into demonstrable work.",
  },
  {
    id: "soft_skills",
    label: "Communication",
    description: "Explain decisions and tell your story.",
  },
  {
    id: "mock_interviews",
    label: "Interviews",
    description: "Rehearse and use feedback to improve.",
  },
];

function resourceLink(value?: string) {
  return value === "/interview" ? value : safeHttpUrl(value);
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <RoadmapContent />
    </Suspense>
  );
}

function RoadmapContent() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company")?.trim().slice(0, 100) || "";
  const role = searchParams.get("role")?.trim().slice(0, 100) || "";
  const { data, error, isLoading, mutate } = useSWR(
    "/api/roadmap",
    optionalRequest<Roadmap>,
    { revalidateOnFocus: false },
  );
  if (isLoading) return <WorkspaceSkeleton />;
  if (data === undefined) {
    return (
      <div className="workspace-page">
        <ErrorNotice error={error} retry={() => void mutate()} />
      </div>
    );
  }
  return (
    <RoadmapWorkspace
      key={`${company}:${role}`}
      roadmap={data}
      target={{ company, role }}
      onChange={(plan) => void mutate(plan, { revalidate: false })}
    />
  );
}

function RoadmapWorkspace({
  roadmap,
  target,
  onChange,
}: {
  roadmap: Roadmap | null;
  target: { company: string; role: string };
  onChange: (roadmap: Roadmap) => void;
}) {
  const [settings, setSettings] = useState(() => {
    const saved = roadmap?.settings || initialSettings;
    return {
      ...saved,
      dreamCompany: target.company || saved.dreamCompany,
      targetRole: target.role || saved.targetRole,
    };
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const overview = roadmap?.overview;
  const prep = roadmap?.interviewPrep;
  const phases = roadmap?.phases ?? [];
  const weeks = phases.reduce(
    (largest, phase) => Math.max(largest, phase.endWeek || 0),
    0,
  );
  const savedSettings = roadmap?.settings;
  const priorities = roadmap?.keySkillsToAcquire ?? [];
  const hasDraftChanges =
    !!savedSettings &&
    JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const shortTimeline =
    savedSettings &&
    weeks < Math.round((savedSettings.timelineMonths * 52) / 12);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      onChange(
        await request<Roadmap>("/api/roadmap", jsonRequest("POST", settings)),
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="workspace-page space-y-7">
      <WorkspaceHeading
        label="Preparation / Roadmap"
        title="A clear path to your next role."
        description="Give your ambition a practical schedule, a weekly outcome, and room to improve along the way."
        actions={<ActionLink href="/tasks">Open practice</ActionLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            label: roadmap ? "Curriculum" : "Proposed horizon",
            value: roadmap
              ? `${weeks} weeks`
              : `${settings.timelineMonths} months`,
            detail: roadmap
              ? `${phases.length} preparation phases`
              : "Adjust your timeline below",
          },
          {
            icon: Clock3,
            label: savedSettings ? "Saved commitment" : "Daily commitment",
            value:
              roadmap && !savedSettings
                ? "Set your schedule"
                : `${savedSettings?.hoursPerDay ?? settings.hoursPerDay}h / day`,
            detail: "A schedule you can consistently keep",
          },
          {
            icon: Layers3,
            label: "Learning priorities",
            value: savedSettings
              ? `${savedSettings.focusAreas.length} focus areas`
              : roadmap
                ? `${priorities.length} skill goals`
                : `${settings.focusAreas.length} focus areas`,
            detail: "Balance knowledge with practical work",
          },
        ].map(({ icon: Icon, label, value, detail }) => (
          <div key={label} className="glass-panel flex items-start gap-4 p-5">
            <IconTile icon={Icon} />
            <div>
              <p className="eyebrow">{label}</p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight">
                {value}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_1.08fr]">
        <Panel>
          <PanelHeading
            title="Shape your plan"
            description="Start with a target, then make the workload realistic."
            action={<IconTile icon={Compass} />}
          />
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void generate();
            }}
          >
            <div className="space-y-4">
              <p className="eyebrow">01 / Your direction</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Target company
                  <Input
                    required
                    value={settings.dreamCompany}
                    maxLength={100}
                    placeholder="e.g. Atlassian"
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        dreamCompany: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Target role
                  <Input
                    required
                    value={settings.targetRole}
                    maxLength={100}
                    placeholder="e.g. Software Engineer"
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        targetRole: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Choose a role you can describe clearly. Your plan will connect
                its expectations with your current skills.
              </p>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <p className="eyebrow">02 / Your capacity</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <RangeField
                  label="Timeline"
                  unit={settings.timelineMonths === 1 ? "month" : "months"}
                  min={1}
                  max={12}
                  value={settings.timelineMonths}
                  onChange={(value) =>
                    setSettings({ ...settings, timelineMonths: value })
                  }
                />
                <RangeField
                  label="Daily time"
                  unit={settings.hoursPerDay === 1 ? "hour" : "hours"}
                  min={1}
                  max={12}
                  value={settings.hoursPerDay}
                  onChange={(value) =>
                    setSettings({ ...settings, hoursPerDay: value })
                  }
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Reserve time for learning, hands-on practice, and projects.
                Start with a commitment that fits around your other
                responsibilities.
              </p>
            </div>

            <fieldset className="border-t border-border pt-5">
              <legend className="sr-only">Choose focus areas</legend>
              <p className="eyebrow mb-3">03 / Your priorities</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {focusOptions.map(({ id, label, description }) => {
                  const selected = settings.focusAreas.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          focusAreas: selected
                            ? settings.focusAreas.filter((area) => area !== id)
                            : [...settings.focusAreas, id],
                        })
                      }
                      className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-colors ${selected ? "border-primary/35 bg-primary/[.07]" : "border-border bg-background/30 hover:bg-background/70"}`}
                    >
                      <span
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25"}`}
                      >
                        {selected && <Check className="size-3" />}
                      </span>
                      <span>
                        <span className="block text-sm font-medium">
                          {label}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {!settings.focusAreas.length && (
                <p className="mt-2 text-xs text-destructive">
                  Choose at least one focus area.
                </p>
              )}
            </fieldset>

            <div className="space-y-3 border-t border-border pt-5">
              {hasDraftChanges && (
                <p className="text-xs font-medium text-primary">
                  Your settings have changed. Build a new plan to apply them.
                </p>
              )}
              <Button
                className="w-full sm:w-auto"
                type="submit"
                disabled={
                  generating ||
                  !settings.dreamCompany.trim() ||
                  !settings.targetRole.trim() ||
                  !settings.focusAreas.length
                }
              >
                {generating ? (
                  <Loader2 className="motion-safe:animate-spin" />
                ) : (
                  <Map />
                )}
                {generating
                  ? "Building your plan…"
                  : roadmap
                    ? "Build a new plan"
                    : "Build my roadmap"}
              </Button>
              {generating && (
                <p
                  className="text-xs leading-relaxed text-muted-foreground"
                  role="status"
                >
                  Working through your profile, study schedule, and weekly
                  deliverables. Longer plans can take a little more time.
                </p>
              )}
              {!!error && <ErrorNotice error={error} />}
            </div>
          </form>
        </Panel>

        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card/55 p-6 text-foreground shadow-[inset_0_1px_0_#ffffffcc,0_24px_60px_-38px_#30386a40] backdrop-blur-xl sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-16 size-60 rounded-full border border-primary/10 bg-primary/[.025]"
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
                  {roadmap ? "Your current roadmap" : "A plan with a purpose"}
                </p>
                <Map className="size-5 text-primary" />
              </div>
              <h2 className="mt-5 max-w-md text-3xl font-medium leading-tight tracking-tight">
                {savedSettings?.dreamCompany
                  ? `Your next chapter at ${savedSettings.dreamCompany}.`
                  : roadmap
                    ? "Your preparation, mapped out."
                    : "Make the next step feel manageable."}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {savedSettings?.targetRole ||
                  (roadmap
                    ? overview?.feasibilityNote
                    : "A useful roadmap connects what you know today with evidence of what you can do tomorrow.")}
              </p>

              {roadmap ? (
                <>
                <div className="my-6 grid grid-cols-2 gap-4 border-y border-border py-5">
                    <div>
                      <p className="text-3xl font-medium tabular-nums">
                        {weeks}
                        <span className="ml-1 text-sm text-muted-foreground">
                          weeks
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Planned curriculum
                      </p>
                    </div>
                    <div>
                      <p className="text-3xl font-medium tabular-nums">
                        {phases.length}
                        <span className="ml-1 text-sm text-muted-foreground">
                          phases
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Distinct milestones
                      </p>
                    </div>
                  </div>
                  <p className="mb-4 text-xs font-medium text-primary">
                    How the plan unfolds
                  </p>
                  <ol className="space-y-3">
                    {phases.slice(0, 4).map((phase, index) => (
                      <li
                        key={phase.phaseNumber ?? index}
                        className="flex items-center gap-3"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/25 text-[10px] font-medium">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 text-sm">
                          {phase.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          W{phase.startWeek}–{phase.endWeek}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {phases.length > 4 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Plus {phases.length - 4} more phases in your curriculum.
                    </p>
                  )}
                  <a
                    href="#weekly-curriculum"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-primary/25 underline-offset-4"
                  >
                    Explore the curriculum
                    <ArrowRight className="size-4" />
                  </a>
                </>
              ) : (
                <ol className="mt-7 space-y-4">
                  {[
                    [
                      "Learn with direction",
                      "Focus on the concepts your target role needs.",
                    ],
                    [
                      "Build visible evidence",
                      "Give each week a practical deliverable.",
                    ],
                    [
                      "Review and adjust",
                      "Use practice feedback to decide your next step.",
                    ],
                  ].map(([title, description], index) => (
                    <li
                      key={title}
                      className="flex gap-3 border-t border-border pt-4"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <Panel>
            <PanelHeading
              title={roadmap ? "Readiness outlook" : "Before you build"}
              action={<IconTile icon={Target} />}
            />
            {roadmap ? (
              <>
                {overview?.feasibility && (
                  <div className="mb-4">
                    <Tag
                      tone={
                        overview.feasibility === "realistic"
                          ? "success"
                          : "warning"
                      }
                    >
                      {prettyLabel(overview.feasibility)} timeline
                    </Tag>
                  </div>
                )}
                {overview?.feasibilityNote && (
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    {overview.feasibilityNote}
                  </p>
                )}
                <div className="space-y-4">
                  {[
                    {
                      label: "Current readiness",
                      value: overview?.currentReadiness,
                    },
                    {
                      label: "Projected after this plan",
                      value: overview?.estimatedFinalReadiness,
                    },
                    {
                      label: "Target readiness",
                      value: overview?.targetReadiness,
                    },
                  ]
                    .filter(({ value }) => typeof value === "number")
                    .map(({ label, value }) => (
                      <div key={label}>
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                          <p>{label}</p>
                          <p className="font-semibold tabular-nums">
                            {clampPercent(value ?? 0)}%
                          </p>
                        </div>
                        <PercentBar value={value ?? 0} label={label} />
                      </div>
                    ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  These model estimates help set a direction. Reassess your
                  profile after meaningful practice to see how your preparation
                  develops.
                </p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Keep your profile up to date with the skills, projects, and
                experience you can discuss confidently. Those details make the
                plan more specific to you.
              </p>
            )}
            <Link
              href="/profile"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              Review my profile
              <ArrowUpRight className="size-4" />
            </Link>
          </Panel>
        </div>
      </div>

      {roadmap && (
        <>
          {(shortTimeline || !!roadmap.warnings?.length) && (
            <Panel>
              <PanelHeading title="Planning considerations" />
              {shortTimeline && (
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  This saved curriculum covers {weeks} weeks for a{" "}
                  {savedSettings.timelineMonths}-month target. Build a new plan
                  above to refresh the full timeline.
                </p>
              )}
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {roadmap.warnings?.map((warning, index) => (
                  <li key={index} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1 shrink-0 rounded-full bg-primary"
                    />
                    {warning}
                  </li>
                ))}
              </ul>
              {!!overview?.alternativeCompanies?.length && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Other companies to explore include{" "}
                  {overview.alternativeCompanies.join(", ")}.
                </p>
              )}
            </Panel>
          )}

          <section id="weekly-curriculum" className="space-y-4 scroll-mt-28">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">From intention to practice</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Your weekly curriculum.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open a phase, choose a week, and work toward its expected
                  outcome.
                </p>
              </div>
              <Tag>{weeks} weeks of preparation</Tag>
            </div>
            {phases.length > 0 ? (
              <div className="space-y-3">
                {phases.map((phase, index) => (
                  <PhaseDetails
                    key={phase.phaseNumber ?? index}
                    phase={phase}
                    first={index === 0}
                  />
                ))}
              </div>
            ) : (
              <Panel>
                <Notice
                  title="Your curriculum needs a refresh"
                  description="Build a new roadmap to generate its weekly goals and practical tasks."
                />
              </Panel>
            )}
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            {!!priorities.length && (
              <Panel>
                <PanelHeading
                  title="Skills worth the effort"
                  description="Use these gaps to choose what deserves your attention first."
                  action={<IconTile icon={BookOpen} />}
                />
                <ul className="divide-y divide-border">
                  {priorities.map((skill, index) => (
                    <li
                      key={index}
                      className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{skill.skill}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[
                            prettyLabel(skill.currentLevel),
                            prettyLabel(skill.targetLevel),
                          ]
                            .filter(Boolean)
                            .join(" → ")}
                        </p>
                        {!!skill.estimatedWeeks && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Estimated focus of {skill.estimatedWeeks} weeks
                          </p>
                        )}
                      </div>
                      {skill.priority && (
                        <Tag
                          tone={
                            skill.priority === "critical"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {prettyLabel(skill.priority)}
                        </Tag>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {prep && (
              <Panel>
                <PanelHeading
                  title="Bring it into the interview"
                  description="Practice explaining your reasoning as carefully as you practice solving."
                  action={<IconTile icon={Flag} />}
                />
                <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-background/40 p-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Coding problem target
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums">
                      {prep.dsaProblemsTarget ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Mock interview target
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums">
                      {prep.mockInterviewsTarget ?? "—"}
                    </dd>
                  </div>
                </dl>
                {!!prep.systemDesignTopics?.length && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold">
                      System design topics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prep.systemDesignTopics.map((topic, index) => (
                        <Tag key={index}>{topic}</Tag>
                      ))}
                    </div>
                  </div>
                )}
                {!!prep.companySpecificTips?.length && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold">
                      Company preparation notes
                    </p>
                    <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">
                      {prep.companySpecificTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-5">
                  <ActionLink href="/interview">
                    Practice an interview
                  </ActionLink>
                </div>
              </Panel>
            )}
          </div>

          <Panel>
            <PanelHeading title="Make the plan part of your week" />
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Choose a weekly outcome",
                  text: "Read the next week’s goal, reserve your study time, and decide what you’ll be able to show by the end.",
                  href: "/tasks",
                  label: "Open daily practice",
                },
                {
                  title: "Use feedback while it is fresh",
                  text: "Rehearse a topic, review the missed points, and return to the exact concept that needs another pass.",
                  href: "/interview",
                  label: "Open mock interviews",
                },
                {
                  title: "Keep your evidence current",
                  text: "Add completed projects and stronger skills to your profile before your next readiness assessment.",
                  href: "/profile",
                  label: "Update your profile",
                },
              ].map(({ title, text, href, label }, index) => (
                <div key={title} className="border-t border-border pt-4">
                  <p className="eyebrow">0{index + 1}</p>
                  <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                  <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                  >
                    {label}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function RangeField({
  label,
  unit,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-3 rounded-2xl border border-border bg-background/40 p-4 text-sm">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="font-semibold tabular-nums">
          {value}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuetext={`${value} ${unit}`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
      <span className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </span>
    </label>
  );
}

function PhaseDetails({
  phase,
  first,
}: {
  phase: Roadmap["phases"][number];
  first: boolean;
}) {
  return (
    <details
      open={first || undefined}
      className="glass-panel group/phase overflow-hidden"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/[.07] font-semibold tabular-nums text-primary">
          {String(phase.phaseNumber).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Weeks {phase.startWeek}–{phase.endWeek}
          </span>
          <span className="block break-words font-semibold sm:text-lg">
            {phase.title}
          </span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none group-open/phase:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
          {phase.objective && (
            <div>
              <p className="eyebrow mb-2">The focus</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {phase.objective}
              </p>
            </div>
          )}
          {phase.milestone && (
            <div className="rounded-2xl border border-primary/10 bg-primary/[.05] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Flag className="size-3.5" />
                Phase milestone
              </p>
              <p className="text-sm leading-relaxed">{phase.milestone}</p>
            </div>
          )}
        </div>

        {!!phase.resources?.length && (
          <div>
            <p className="eyebrow mb-2">Study resources</p>
            <ul className="flex flex-wrap gap-2">
              {phase.resources.map((resource, index) => {
                const href = resourceLink(resource.url);
                return (
                  <li key={index}>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("/") ? undefined : "_blank"}
                        rel={href.startsWith("/") ? undefined : "noreferrer"}
                        title={resource.description}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/45 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/[.07]"
                      >
                        {resource.title}
                        <ArrowUpRight className="size-3" />
                      </a>
                    ) : (
                      <Tag>{resource.title}</Tag>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!!phase.weeks?.length && (
          <div className="space-y-2">
            {phase.weeks.map((week, index) => (
              <details
                key={week.weekNumber ?? index}
                className="group/week overflow-hidden rounded-2xl border border-border bg-background/35"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                    W{String(week.weekNumber).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-sm font-medium">
                    {week.focus}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none group-open/week:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-border p-4 text-sm">
                  {week.weeklyGoal && (
                    <div>
                      <p className="eyebrow mb-1.5">This week’s outcome</p>
                      <p className="leading-relaxed">{week.weeklyGoal}</p>
                    </div>
                  )}
                  {week.dailyHoursBreakdown && (
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(week.dailyHoursBreakdown).map(
                        ([name, hours]) => (
                          <div
                            key={name}
                            className="rounded-xl border border-border bg-card/40 p-3"
                          >
                            <p className="text-[10px] text-muted-foreground">
                              {prettyLabel(name)}
                            </p>
                            <p className="mt-1 text-sm font-semibold tabular-nums">
                              {hours}h
                              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                / day
                              </span>
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  {!!week.tasks?.length && (
                    <ul className="space-y-3">
                      {week.tasks.map((task, taskIndex) => (
                        <li
                          key={taskIndex}
                          className="border-t border-border pt-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{task.title}</p>
                            {task.type && <Tag>{prettyLabel(task.type)}</Tag>}
                          </div>
                          {task.description && (
                            <p className="mt-2 leading-relaxed text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          {task.deliverable && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/[.05] p-3">
                              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                              <p className="text-xs leading-relaxed">
                                <span className="font-semibold">
                                  Expected deliverable{" "}
                                </span>
                                {task.deliverable}
                              </p>
                            </div>
                          )}
                          {!!task.resources?.length && (
                            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                              {task.resources.map((resource, resourceIndex) => {
                                const href = resourceLink(resource);
                                return (
                                  <li
                                    key={resourceIndex}
                                    className="min-w-0 break-all text-xs"
                                  >
                                    {href ? (
                                      <a
                                        href={href}
                                        target={
                                          href.startsWith("/")
                                            ? undefined
                                            : "_blank"
                                        }
                                        rel="noreferrer"
                                        className="text-primary underline underline-offset-4"
                                      >
                                        {href.startsWith("/")
                                          ? "Practice interview"
                                          : new URL(href).hostname}
                                        <span className="sr-only"> {href}</span>
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {resource}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
