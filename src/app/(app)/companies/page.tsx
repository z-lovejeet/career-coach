"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Compass,
  Filter,
  Globe2,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  jsonRequest,
  optionalRequest,
  request,
  WorkspaceRequestError,
} from "@/components/workspace/api";
import {
  ActionLink,
  clampPercent,
  dateFormat,
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
import type { CompanyMatch, CompanyRecommendation, Profile } from "@/types";

interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salaryInfo: string[];
  postedAt: string;
  applyUrl?: string;
  link?: string;
  description?: string;
  employmentType?: string;
  seniorityLevel?: string;
}

type JobsData =
  | {
      source: "linkedin";
      jobs: Job[];
      total: number;
      scrapedAt: string;
      searchUrl?: string;
    }
  | { source: "search"; jobs: []; total: 0; searchUrl: string };

function linkedInSearch(role: string, company?: string) {
  const url = new URL("https://www.linkedin.com/jobs/search/");
  url.searchParams.set("keywords", [role, company].filter(Boolean).join(" "));
  return url.href;
}

function validDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateFormat.format(date) : null;
}

export default function CompaniesPage() {
  const {
    data: matches,
    isLoading,
    error: matchError,
    mutate,
  } = useSWR("/api/companies", optionalRequest<CompanyRecommendation>);
  const { data: profile } = useSWR("/api/profile", request<Profile>, {
    revalidateOnFocus: false,
  });
  const [view, setView] = useState<"matches" | "jobs">("matches");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("Finding your matches…");
  const [searching, setSearching] = useState(false);
  const [recommendError, setRecommendError] = useState<unknown>(null);
  const [jobError, setJobError] = useState<unknown>(null);
  const [jobs, setJobs] = useState<JobsData | null>(null);
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("all");

  async function generate() {
    setGenerating(true);
    setGenerationStep("Finding your matches…");
    setRecommendError(null);
    try {
      let result: CompanyRecommendation;
      try {
        result = await request("/api/companies", { method: "POST" });
      } catch (failure) {
        if (
          !(failure instanceof WorkspaceRequestError) ||
          failure.status !== 400
        )
          throw failure;
        setGenerationStep("Assessing your profile first…");
        await request("/api/analyze", { method: "POST" });
        setGenerationStep("Connecting your skills with suitable roles…");
        result = await request("/api/companies", { method: "POST" });
      }
      await mutate(result, { revalidate: false });
    } catch (failure) {
      setRecommendError(failure);
    } finally {
      setGenerating(false);
    }
  }

  async function search() {
    setSearching(true);
    setJobError(null);
    setResultFilter("");
    setEmploymentFilter("all");
    try {
      setJobs(
        await request<JobsData>(
          "/api/jobs",
          jsonRequest("POST", {
            keywords: keywords.trim(),
            location: location.trim(),
          }),
        ),
      );
    } catch (failure) {
      setJobError(failure);
    } finally {
      setSearching(false);
    }
  }

  const fit = matches?.current_fit_companies ?? [];
  const targets = matches?.target_companies ?? [];
  const gaps = matches?.skill_gaps ?? [];
  const fallback =
    jobs?.source === "search" ? safeHttpUrl(jobs.searchUrl) : null;
  const retrieved =
    jobs?.source === "linkedin" ? validDate(jobs.scrapedAt) : null;
  const listedJobs = jobs?.source === "linkedin" ? jobs.jobs : [];
  const employmentTypes = [
    ...new Set(
      listedJobs
        .map((job) => job.employmentType)
        .filter((type): type is string => !!type),
    ),
  ];
  const normalizedFilter = resultFilter.trim().toLowerCase();
  const filteredJobs = listedJobs.filter(
    (job) =>
      [job.title, job.companyName, job.location]
        .join(" ")
        .toLowerCase()
        .includes(normalizedFilter) &&
      (employmentFilter === "all" || job.employmentType === employmentFilter),
  );
  const profileRole =
    profile?.preferred_role || profile?.skills?.slice(0, 3).join(" ");
  const profileLocation = profile?.preferred_locations?.[0];
  const updated = validDate(matches?.created_at);

  return (
    <div className="workspace-page space-y-7">
      <WorkspaceHeading
        label="Career / Opportunities"
        title="Your next move, thoughtfully chosen."
        description="Understand where your skills fit, close the right gaps, and explore current openings with a clear direction."
        actions={<ActionLink href="/profile">Review my profile</ActionLink>}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex w-fit max-w-full gap-1 rounded-full border border-border bg-card/50 p-1.5"
          role="group"
          aria-label="Opportunity view"
        >
          {[
            { id: "matches", label: "Company fit", icon: Building2 },
            { id: "jobs", label: "Current openings", icon: BriefcaseBusiness },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={view === id ? "default" : "ghost"}
              aria-pressed={view === id}
              onClick={() => setView(id as "matches" | "jobs")}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Compass className="size-3.5" />
          Find the fit. Then explore the role.
        </p>
      </div>

      {view === "matches" ? (
        <div className="space-y-6">
          <div className="grid items-stretch gap-5 xl:grid-cols-[1.25fr_1fr]">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card/55 p-6 text-foreground shadow-[inset_0_1px_0_#ffffffcc,0_24px_60px_-38px_#30386a40] backdrop-blur-xl sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full border border-primary/10 bg-primary/[.025]"
              />
              <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
                  A shortlist with a reason
                </p>
                <h2 className="mt-4 max-w-md text-3xl font-medium tracking-tight">
                  Look for work that moves you forward.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Your profile and readiness assessment help surface companies
                  to explore now and targets to prepare for next.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => void generate()}
                    disabled={generating}
                    className="border border-primary/20 bg-accent text-accent-foreground hover:bg-accent/80"
                  >
                    {generating ? (
                      <Loader2 className="motion-safe:animate-spin" />
                    ) : (
                      <Sparkles />
                    )}
                    {generating
                      ? "Building your shortlist…"
                      : matches
                        ? "Refresh my matches"
                        : "Find my matches"}
                  </Button>
                  {updated && (
                    <p className="text-xs text-muted-foreground">Updated {updated}</p>
                  )}
                </div>
                {generating && (
                  <p
                    className="mt-4 text-xs leading-relaxed text-muted-foreground"
                    role="status"
                  >
                    {generationStep}
                  </p>
                )}
              </div>
            </section>

            <Panel>
              <PanelHeading
                title="Your opportunity landscape"
                description="A snapshot of your latest saved recommendations."
                action={<IconTile icon={Target} />}
              />
              <dl className="grid grid-cols-3 divide-x divide-border">
                {[
                  { label: "Current fit", value: matches ? fit.length : "—" },
                  {
                    label: "Stretch targets",
                    value: matches ? targets.length : "—",
                  },
                  {
                    label: "Skill priorities",
                    value: matches ? gaps.length : "—",
                  },
                ].map(({ label, value }, index) => (
                  <div key={label} className={index ? "pl-4" : "pr-4"}>
                    <dt className="text-xs leading-relaxed text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-3 text-3xl font-semibold tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                Fit scores describe the model’s assessment of your skills
                against a role. Review the company’s current requirements when
                deciding where to apply.
              </p>
            </Panel>
          </div>

          {!!recommendError && <ErrorNotice error={recommendError} />}
          {!!matchError && (
            <ErrorNotice error={matchError} retry={() => void mutate()} />
          )}

          {isLoading ? (
            <WorkspaceSkeleton />
          ) : fit.length || targets.length ? (
            <>
              {fit.length > 0 && (
                <section className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow">Start exploring</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                        Closer to your current strengths.
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Read the rationale, compare the requirements, and look
                        for a relevant opening.
                      </p>
                    </div>
                    <Tag tone="success">
                      {fit.length} {fit.length === 1 ? "company" : "companies"}
                    </Tag>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {fit.map((company, index) => (
                      <CompanyCard
                        key={`${company.name}-${index}`}
                        company={company}
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              )}
              {targets.length > 0 && (
                <section className="space-y-4">
                  <div>
                    <p className="eyebrow">Make room to grow</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Worth working toward.
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Treat the gaps as preparation topics and build evidence
                      that you can meet the role.
                    </p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {targets.map((company, index) => (
                      <CompanyCard
                        key={`${company.name}-${index}`}
                        company={company}
                        index={index}
                        stretch
                      />
                    ))}
                  </div>
                </section>
              )}

              <div className="grid items-start gap-5 lg:grid-cols-2">
                {!!gaps.length && (
                  <Panel>
                    <PanelHeading
                      title="The skills that open doors"
                      description="Use your assessed gaps to give practice a useful direction."
                      action={<IconTile icon={BookOpen} />}
                    />
                    <ul className="divide-y divide-border">
                      {gaps.map((gap, index) => (
                        <li
                          key={index}
                          className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                        >
                          {typeof gap === "string" ? (
                            <p className="text-sm font-medium">{gap}</p>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">
                                  {gap.skill}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {[
                                    prettyLabel(gap.current_level),
                                    prettyLabel(gap.required_level),
                                  ]
                                    .filter(Boolean)
                                    .join(" → ")}
                                </p>
                              </div>
                              {gap.priority && (
                                <Tag
                                  tone={
                                    gap.priority === "critical"
                                      ? "warning"
                                      : "neutral"
                                  }
                                >
                                  {prettyLabel(gap.priority)}
                                </Tag>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 border-t border-border pt-4">
                      <ActionLink href="/tasks">
                        Turn gaps into practice
                      </ActionLink>
                    </div>
                  </Panel>
                )}
                {!!matches?.roadmap_to_target?.length && (
                  <Panel>
                    <PanelHeading
                      title="A preparation direction"
                      description="Bring the strongest recommendations into a schedule you can follow."
                      action={<IconTile icon={Compass} />}
                    />
                    <ol className="space-y-5">
                      {matches.roadmap_to_target.map((milestone, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/[.06] text-xs font-semibold text-primary">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {typeof milestone === "string" ? (
                            <p className="pt-1 text-sm leading-relaxed">
                              {milestone}
                            </p>
                          ) : (
                            <div className="min-w-0">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Month {milestone.month}
                              </p>
                              <p className="text-sm font-semibold">
                                {milestone.focus}
                              </p>
                              {!!milestone.tasks?.length && (
                                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                                  {milestone.tasks.map((task, taskIndex) => (
                                    <li key={taskIndex}>{task}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 border-t border-border pt-4">
                      <ActionLink href="/roadmap">Build my roadmap</ActionLink>
                    </div>
                  </Panel>
                )}
              </div>
            </>
          ) : (
            !matchError && (
              <Panel>
                <Notice
                  icon={Building2}
                  title="Build a shortlist around your strengths"
                  description="Add your real experience and skills to your profile, then find company suggestions with a reason behind each match."
                  action={
                    <Link
                      href="/profile"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Review profile
                      <ArrowRight />
                    </Link>
                  }
                />
              </Panel>
            )
          )}

          <Panel>
            <PanelHeading title="From a promising company to a thoughtful application" />
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Read the actual requirements",
                  text: "Open a current role and compare the experience, responsibilities, and essential skills with your profile.",
                },
                {
                  title: "Choose the evidence",
                  text: "Bring forward the projects and outcomes that show you can do the work this particular role needs.",
                },
                {
                  title: "Prepare for the conversation",
                  text: "Practice explaining a relevant technical decision, a trade-off, and a challenge you worked through.",
                },
              ].map(({ title, text }, index) => (
                <div key={title} className="border-t border-border pt-4">
                  <p className="eyebrow">0{index + 1}</p>
                  <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : (
        <div className="space-y-5">
          <Panel>
            <PanelHeading
              title="Find current LinkedIn openings"
              description="Search with a role, skill, or company. Add a location to narrow your results."
              action={<IconTile icon={Search} />}
            />
            <form
              className="grid items-end gap-4 md:grid-cols-[1fr_.8fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void search();
              }}
            >
              <label className="grid gap-2 text-sm font-medium">
                Role, skill, or company
                <Input
                  type="search"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder={profileRole || "e.g. Frontend Engineer"}
                  maxLength={120}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Location
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={profileLocation || "e.g. Bengaluru"}
                  maxLength={100}
                />
              </label>
              <Button type="submit" disabled={searching}>
                {searching ? (
                  <Loader2 className="motion-safe:animate-spin" />
                ) : (
                  <Search />
                )}
                {searching ? "Searching…" : "Search openings"}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              <span>Blank fields use your profile preferences.</span>
              {profileRole && (
                <span className="flex items-center gap-1.5">
                  <BriefcaseBusiness className="size-3.5" />
                  {profileRole}
                </span>
              )}
              {profileLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {profileLocation}
                </span>
              )}
            </div>
          </Panel>

          {!!jobError && (
            <ErrorNotice error={jobError} retry={() => void search()} />
          )}
          {searching && (
            <div
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-5 text-sm text-muted-foreground"
              role="status"
            >
              <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" />
              <p>
                Retrieving listings from LinkedIn. Your search can take a few
                seconds.
              </p>
            </div>
          )}
          {jobs?.source === "search" && (
            <Panel>
              <Notice
                icon={Globe2}
                title="Continue your search on LinkedIn"
                description="Open the same role and location search directly on LinkedIn to review current openings."
                action={
                  fallback && (
                    <a
                      href={fallback}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants()}
                    >
                      Open LinkedIn search
                      <ArrowUpRight />
                    </a>
                  )
                }
              />
            </Panel>
          )}
          {jobs?.source === "linkedin" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {jobs.total} {jobs.total === 1 ? "opening" : "openings"} to
                    explore
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source LinkedIn
                    {retrieved ? ` · Retrieved ${retrieved}` : ""}
                  </p>
                </div>
                <Tag tone="success">LinkedIn listings</Tag>
              </div>
              {listedJobs.length > 0 ? (
                <>
                  <div className="glass-panel flex flex-wrap items-end gap-4 p-4 sm:p-5">
                    <label className="grid min-w-48 flex-1 gap-2 text-xs font-medium">
                      Filter these results
                      <Input
                        type="search"
                        value={resultFilter}
                        onChange={(event) =>
                          setResultFilter(event.target.value)
                        }
                        placeholder="Search role, company, or location"
                        maxLength={120}
                      />
                    </label>
                    {employmentTypes.length > 1 && (
                      <label className="grid gap-2 text-xs font-medium">
                        Employment type
                        <select
                          className="h-11 rounded-xl border border-border bg-card/70 px-3 text-sm"
                          value={employmentFilter}
                          onChange={(event) =>
                            setEmploymentFilter(event.target.value)
                          }
                        >
                          <option value="all">All types</option>
                          {employmentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <p className="flex h-11 items-center gap-1.5 text-xs text-muted-foreground">
                      <Filter className="size-3.5" />
                      {filteredJobs.length} shown
                    </p>
                  </div>
                  {filteredJobs.length > 0 ? (
                    <div className="space-y-4">
                      {filteredJobs.map((job, index) => (
                        <JobCard key={`${job.id}-${index}`} job={job} />
                      ))}
                    </div>
                  ) : (
                    <Panel>
                      <Notice
                        title="Try a broader filter"
                        description="Change the text or employment type to see more of the retrieved results."
                        action={
                          <Button
                            variant="outline"
                            onClick={() => {
                              setResultFilter("");
                              setEmploymentFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        }
                      />
                    </Panel>
                  )}
                </>
              ) : (
                <Panel>
                  <Notice
                    title="Try a broader search"
                    description="Use a simpler role title or a nearby location to explore more openings."
                  />
                </Panel>
              )}
            </>
          )}
          {!jobs && !jobError && !searching && (
            <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
              <Panel>
                <Notice
                  icon={BriefcaseBusiness}
                  title="A good search starts with a clear role"
                  description="Try the title you want next, a skill you want to use, or a company you’re interested in. You can refine the returned listings without running another search."
                />
              </Panel>
              <Panel>
                <PanelHeading title="Make your search more useful" />
                <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <ArrowRight className="mt-1 size-3.5 shrink-0 text-primary" />
                    Start with the role title used in real job descriptions.
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="mt-1 size-3.5 shrink-0 text-primary" />
                    Try a nearby city or a broader region if results are
                    limited.
                  </li>
                  <li className="flex gap-2">
                    <ArrowRight className="mt-1 size-3.5 shrink-0 text-primary" />
                    Check seniority and responsibilities before deciding to
                    apply.
                  </li>
                </ul>
              </Panel>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompanyCard({
  company,
  index,
  stretch = false,
}: {
  company: CompanyMatch;
  index: number;
  stretch?: boolean;
}) {
  const percent = clampPercent(company.match_score);
  const strengths = company.matching_skills ?? [];
  const skillGaps = company.gap_skills ?? [];
  return (
    <Panel className="flex flex-col">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/[.07] text-sm font-semibold text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-semibold">{company.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {company.role}
          </p>
        </div>
        <Tag tone={stretch ? "neutral" : "success"}>{percent}% fit</Tag>
      </div>
      <div className="mt-5">
        <PercentBar value={percent} label={`${company.name} fit estimate`} />
      </div>
      {company.reason && (
        <div className="mt-5">
          <p className="eyebrow mb-2">
            {stretch ? "Why it is worth preparing for" : "Why this could fit"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {company.reason}
          </p>
        </div>
      )}
      {!!strengths.length && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold">Skills that connect</p>
          <div className="flex flex-wrap gap-1.5">
            {strengths.map((skill, skillIndex) => (
              <Tag tone="success" key={skillIndex}>
                {skill}
              </Tag>
            ))}
          </div>
        </div>
      )}
      {!!skillGaps.length && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold">Preparation priorities</p>
          <div className="flex flex-wrap gap-1.5">
            {skillGaps.map((skill, skillIndex) => (
              <Tag key={skillIndex}>{skill}</Tag>
            ))}
          </div>
        </div>
      )}
      {!!company.required_skills?.length && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
            Explore role requirements
            <ChevronDown className="size-3.5 transition-transform motion-reduce:transition-none group-open:rotate-180" />
          </summary>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {company.required_skills.map((skill, skillIndex) => (
              <Tag key={skillIndex}>{skill}</Tag>
            ))}
          </div>
        </details>
      )}
      {company.estimated_timeline && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Estimated preparation time {company.estimated_timeline}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <a
          href={linkedInSearch(company.role, company.name)}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Explore openings
          <ArrowUpRight />
        </a>
        <Link
          href={{ pathname: "/roadmap", query: { company: company.name, role: company.role } }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          Plan my preparation
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  );
}

function JobCard({ job }: { job: Job }) {
  const url = safeHttpUrl(job.applyUrl) ?? safeHttpUrl(job.link);
  const posted = validDate(job.postedAt) || job.postedAt;
  return (
    <Panel>
      <div className="flex flex-wrap items-start gap-4">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/[.07] text-lg font-semibold text-primary"
          aria-hidden="true"
        >
          {job.companyName.trim().charAt(0).toUpperCase() || (
            <Building2 className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1 basis-52">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {job.companyName}
          </p>
          <h3 className="break-words text-lg font-semibold leading-snug">
            {job.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {job.location}
              </span>
            )}
            {posted && <span>{posted}</span>}
          </div>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View role
            <ArrowUpRight />
          </a>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {job.employmentType && <Tag>{job.employmentType}</Tag>}
        {job.seniorityLevel && <Tag>{job.seniorityLevel}</Tag>}
        {(Array.isArray(job.salaryInfo) ? job.salaryInfo : []).map(
          (salary, index) => (
            <Tag key={index}>{salary}</Tag>
          ),
        )}
      </div>
      {job.description && (
        <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
          {job.description}
        </p>
      )}
    </Panel>
  );
}
