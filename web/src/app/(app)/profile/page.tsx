"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, CheckCircle2, Circle, FileText, FolderOpen, Globe, Loader2, ShieldCheck, Sparkles, Target, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { optionalRequest, request } from "@/components/workspace/api";
import { ResumeControl } from "@/components/workspace/resume-control";
import { ActionLink, clampPercent, dateFormat, ErrorNotice, IconTile, Notice, Panel, PanelHeading, PercentBar, prettyLabel, safeHttpUrl, Tag, WorkspaceHeading, WorkspaceSkeleton } from "@/components/workspace/ui";
import type { Analysis, Profile } from "@/types";

export default function ProfilePage() {
  const { data: profile, error, isLoading, mutate } = useSWR("/api/profile", optionalRequest<Profile>);
  const { data: analysis, error: analysisError, isLoading: loadingAnalysis, mutate: refreshAnalysis } = useSWR("/api/analyze/latest", optionalRequest<Analysis>);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  async function assess() {
    setAssessmentError(null);
    setAnalyzing(true);
    try {
      const result = await request<Analysis>("/api/analyze", { method: "POST" });
      await refreshAnalysis(result, { revalidate: false });
    } catch (failure) {
      setAssessmentError(failure instanceof Error ? failure.message : "Your assessment could not be completed.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (isLoading) return <WorkspaceSkeleton />;
  if (error && profile === undefined) return <div className="workspace-page"><ErrorNotice error={error} retry={() => void mutate()} /></div>;
  if (!profile) return <div className="workspace-page"><Notice icon={User} title="Set up your profile" description="Add your skills, experience, and career goals to personalize your workspace." action={<ActionLink href="/onboarding">Start setup</ActionLink>} /></div>;

  const links = [
    { label: "GitHub", url: safeHttpUrl(profile.github_url) },
    { label: "LinkedIn", url: safeHttpUrl(profile.linkedin_url) },
    { label: "Portfolio", url: safeHttpUrl(profile.portfolio_url) },
  ].filter((link): link is { label: string; url: string } => !!link.url);
  const fullName = profile.full_name?.trim();
  const skills = profile.skills ?? [];
  const goals = profile.goals ?? [];
  const projects = profile.projects ?? [];
  const coverage = [
    { label: "Personal details", detail: fullName ? "Name and account information added" : "Add your name so your workspace feels like yours", ready: !!fullName },
    { label: "Skill profile", detail: skills.length ? `${skills.length} skills listed` : "Add skills you use or are learning", ready: skills.length > 0 },
    { label: "Work you can discuss", detail: projects.length ? `${projects.length} projects added` : "Add a project with context and technologies", ready: projects.length > 0 },
    { label: "Career direction", detail: profile.preferred_role || (goals.length ? `${goals.length} interests selected` : "Choose a role or career interest"), ready: !!profile.preferred_role || goals.length > 0 },
    { label: "Resume", detail: profile.resume_url ? "An account-protected PDF is attached" : "Attach a resume for additional experience context", ready: !!profile.resume_url },
    { label: "Professional links", detail: links.length ? links.map((link) => link.label).join(" · ") : "Add a portfolio, GitHub, or LinkedIn link", ready: links.length > 0 },
  ];
  const completeSections = coverage.filter((section) => section.ready).length;
  const selfRatings = skills.flatMap((skill) => typeof profile.skill_ratings?.[skill] === "number" ? [profile.skill_ratings[skill]] : []);
  const demonstrated = projects.filter((project) => project.description?.trim() && project.tech?.length).length;
  const assessmentDate = analysis?.created_at ? new Date(analysis.created_at) : null;
  const assessment = analysis ? [
    { title: "Strengths", items: analysis.strengths ?? [] },
    { title: "Areas to improve", items: analysis.weaknesses ?? [] },
    { title: "Skills to develop", items: analysis.missing_skills ?? [] },
  ] : [];

  return (
    <div className="workspace-page space-y-6">
      <WorkspaceHeading label="Profile" title="Your professional profile." description="Keep your experience and goals current so your guidance stays relevant." actions={<ActionLink href="/onboarding">Edit profile</ActionLink>} />
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <Panel>
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-[22px] border border-border bg-primary/10 text-xl font-semibold text-primary shadow-sm">
              {fullName?.split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || <User className="size-6" />}
            </div>
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-semibold">{fullName || "Your profile"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile.preferred_role || "Add your target role"}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{profile.email}</p>
              {profile.phone && <p className="mt-1 text-sm text-muted-foreground">{profile.phone}</p>}
            </div>
          </div>
          <dl className="mt-6 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Education</dt><dd className="mt-1 font-medium">{[prettyLabel(profile.education_level), profile.field_of_study].filter(Boolean).join(" · ") || "Unspecified"}</dd></div>
            <div><dt className="text-muted-foreground">Experience</dt><dd className="mt-1 font-medium">{prettyLabel(profile.experience_level) || "Unspecified"}</dd></div>
            {!!profile.preferred_locations?.length && <div className="sm:col-span-2"><dt className="text-muted-foreground">Preferred locations</dt><dd className="mt-1 font-medium">{profile.preferred_locations.join(", ")}</dd></div>}
          </dl>
          {links.length > 0 && <div className="mt-5 flex flex-wrap gap-2">
            {links.map(({ label, url }) => <a key={label} href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><Globe />{label}<ArrowUpRight /></a>)}
          </div>}
        </Panel>
        <Panel>
          <PanelHeading title="Resume" description="Attach a PDF to bring your work and education into your assessment." action={<IconTile icon={FileText} />} />
          <ResumeControl
            attached={!!profile.resume_url}
            onBusyChange={setResumeBusy}
            onChange={(attached) => void mutate((current) => current ? { ...current, resume_url: attached ? "/api/onboarding/resume" : null } : current, { revalidate: false })}
          />
          <div className="mt-5 flex items-start gap-3 border-t border-border pt-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">Your PDF opens through your signed-in account. Replacing or removing it updates the stored attachment. Refresh your assessment after making changes to your experience.</p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeading title="Give your profile more context" description="See which parts of your profile are populated and what you can add next." action={<Tag tone="accent">{completeSections} of {coverage.length} areas populated</Tag>} />
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {coverage.map(({ label, detail, ready }) => <li key={label} className="flex items-start gap-2.5">
            {ready ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
            <div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>
          </li>)}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs leading-relaxed text-muted-foreground">More specific examples help your mentor connect advice to your actual experience.</p><ActionLink href="/onboarding" variant="ghost">Review details</ActionLink></div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <Panel>
          <PanelHeading title="Your skill profile" description="Your own confidence ratings, from 1 to 10." action={<Tag>{skills.length} added</Tag>} />
          {skills.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {skills.map((skill, index) => {
                const rating = profile.skill_ratings?.[skill];
                return <li key={`${skill}-${index}`}><div className="mb-2 flex justify-between gap-2 text-sm"><span className="break-words font-medium">{skill}</span><span className="shrink-0 text-muted-foreground">{typeof rating === "number" ? `${rating}/10` : "Unrated"}</span></div><PercentBar label={`${skill} rating`} value={(rating ?? 0) * 10} /></li>;
              })}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Add skills in your profile to get more relevant practice tasks.</p>}
          {selfRatings.length > 0 && <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm"><div><p className="text-muted-foreground">Skills rated</p><p className="mt-1 font-semibold tabular-nums">{selfRatings.length} of {skills.length}</p></div><div><p className="text-muted-foreground">Confident areas</p><p className="mt-1 font-semibold tabular-nums">{selfRatings.filter((rating) => rating >= 7).length} rated 7 or above</p></div></div>}
        </Panel>
        <Panel>
          <PanelHeading title="Your career direction" description="The preferences that shape your company suggestions and preparation plans." action={<IconTile icon={Target} />} />
          <dl className="space-y-4 text-sm">
            <div><dt className="text-muted-foreground">Role you’re working toward</dt><dd className="mt-1 text-lg font-semibold">{profile.preferred_role || "Choose your target role"}</dd></div>
            <div><dt className="text-muted-foreground">Location preferences</dt><dd className="mt-1 font-medium">{profile.preferred_locations?.length ? profile.preferred_locations.join(" · ") : "Add cities or remote preferences"}</dd></div>
            <div><dt className="mb-2 text-muted-foreground">Areas of interest</dt><dd className="flex flex-wrap gap-2">{goals.length ? goals.map((goal, index) => <Tag key={index}>{prettyLabel(goal)}</Tag>) : "Choose a few areas you want to explore"}</dd></div>
          </dl>
          <div className="mt-5 border-t border-border pt-4"><ActionLink href="/companies" variant="outline">Explore opportunities</ActionLink></div>
        </Panel>
      </div>
      <Panel>
        <PanelHeading title="Projects you can speak about" description="Build a clear account of what you made, how it works, and the decisions you owned." action={<Tag>{demonstrated} with context and technology</Tag>} />
        {projects.length ? <div className="grid gap-4 md:grid-cols-2">{projects.map((project, index) => {
          const url = safeHttpUrl(project.url);
          return <article key={index} className="min-w-0 rounded-2xl border border-border bg-background/20 p-4 sm:p-5">
            <div className="flex items-start gap-3"><IconTile icon={FolderOpen} /><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{project.name}</h3><p className="mt-1 text-xs text-muted-foreground">{project.tech?.length ? project.tech.join(" · ") : "Add the technologies you used"}</p></div></div>
            <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground">{project.description || "Add a short explanation of the problem, your contribution, and what you built."}</p>
            <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-medium text-primary">Prepare your project story</summary><ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground"><li>What problem did this solve, and for whom?</li><li>Which technical decision did you own? Explain the trade-off.</li><li>How did you test the result, and what would you improve next?</li></ol></details>
            {url && <a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-3" })}>View project<ArrowUpRight /></a>}
          </article>;
        })}</div> : <Notice icon={FolderOpen} title="Add a project with a story" description="A course assignment, side project, internship contribution, or open-source change can show how you approach real work." action={<ActionLink href="/onboarding">Add experience</ActionLink>} />}
      </Panel>

      <Panel>
        <PanelHeading title="Readiness assessment" description="Review the strengths and gaps identified from your profile." action={
          <Button disabled={analyzing || resumeBusy} onClick={() => void assess()}>{analyzing ? <Loader2 className="motion-safe:animate-spin" /> : <Sparkles />}{analyzing ? "Assessing…" : analysis ? "Refresh assessment" : "Run assessment"}</Button>
        } />
        {assessmentError && <p role="alert" className="mb-4 text-sm text-destructive">{assessmentError}</p>}
        {analysisError && !analysis && <ErrorNotice error={analysisError} retry={() => void refreshAnalysis()} />}
        {analysis && (
          <>
            <div className="mb-6 grid gap-5 rounded-2xl border border-primary/12 bg-primary/6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="text-4xl font-semibold tabular-nums text-primary">{clampPercent(analysis.readiness_score)}<span className="text-lg">/100</span></div>
              <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p>Use the assessment to choose what to practice and which experience to explain more clearly.</p>{assessmentDate && Number.isFinite(assessmentDate.getTime()) && <p>Updated {dateFormat.format(assessmentDate)}</p>}</div>
            <div className="grid gap-5 md:grid-cols-3">
              {assessment.map(({ title, items }) => (
                <div key={title} className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {items.map((item, index) => typeof item === "string" ? <li key={index}>{item}</li> : item && <li key={index}><p className="font-medium">{item.skill}</p>{item.reason && <p className="mt-0.5 text-muted-foreground">{item.reason}</p>}</li>)}
                  </ul>
                  {!items.length && <p className="mt-2 text-xs text-muted-foreground">No items were highlighted in this assessment.</p>}
                </div>
              ))}
            </div>
            {!!analysis.extracted_skills?.length && <div className="mt-6 border-t border-border pt-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Skills identified in your assessment</h3><p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Levels are inferred from your profile and resume. Confidence describes how strongly the assessment identified that skill.</p></div><Tag>{analysis.extracted_skills.length} identified</Tag></div>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{analysis.extracted_skills.map((skill, index) => {
                if (typeof skill === "string") return <li key={index} className="rounded-xl border border-border p-3 text-sm font-medium">{skill}</li>;
                const confidence = typeof skill?.confidence === "number" ? clampPercent(skill.confidence * 100) : null;
                return <li key={index} className="rounded-xl border border-border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-semibold">{skill?.name}</p><Tag>{prettyLabel(skill?.level)}</Tag></div>{confidence !== null && <p className="mt-2 text-xs text-muted-foreground">{confidence}% identification confidence</p>}</li>;
              })}</ul>
            </div>}
          </>
        )}
        {loadingAnalysis && <p className="text-sm text-muted-foreground" role="status">Loading assessment…</p>}
        {!analysis && !analysisError && !loadingAnalysis && <Notice icon={Sparkles} title="Get your baseline" description="Run an assessment to see how your current skills line up with your career goals." />}
      </Panel>
    </div>
  );
}
