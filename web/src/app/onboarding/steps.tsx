"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, FileText, FileUp, Keyboard, Loader2, Plus, ScanText, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { Badge, Button, ChipInput, Field, Input, Segmented, Select, Textarea } from "@/components/ui/primitives";
import { Radar } from "@/components/ui/charts";
import { api } from "@/lib/api";
import { readCv } from "@/lib/cv-reader";
import { hollandCode, RIASEC_ITEMS, RIASEC_TYPES, scoreRiasec } from "@/lib/riasec";
import { COMPANIES, COURSEWORK, INDUSTRIES, INTEREST_AREAS, LOCATIONS, ROLES, SKILLS } from "@/lib/suggestions";
import type { CareerMatch, FamilyFit, Profile, ProfileAnalysis, Skill } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Draft = Pick<Profile, "full_name" | "headline" | "education" | "academics" | "skills" | "projects" | "experience" | "certifications" | "achievements" | "interests" | "goals">;
type StepProps = { draft: Draft; update: (patch: Partial<Draft>) => void };

function Section({ title, hint, children, action }: { title: string; hint?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card p-6 sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── 0. Welcome ──────────────────────────────────────────────────
export function WelcomeStep({ onCv, onManual }: { onCv: () => void; onManual: () => void }) {
  const items = ["Education & academics", "Skills (self-rated)", "Projects, internships, certifications", "Interest profile", "Goals & time budget"];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={onCv} className="group card flex flex-col items-start p-6 text-left transition-all hover:-translate-y-0.5 hover:border-accent-line hover:shadow-float">
          <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-ink"><FileUp className="size-5" /></span>
          <span className="mt-5 text-[17px] font-semibold text-ink">Upload my CV</span>
          <span className="mt-1 text-sm leading-relaxed text-muted">PDF or photo. We fill in everything we can find; you review and edit.</span>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent">Recommended <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </button>
        <button onClick={onManual} className="group card flex flex-col items-start p-6 text-left transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float">
          <span className="grid size-11 place-items-center rounded-full border border-line-strong text-ink-2"><Keyboard className="size-5" /></span>
          <span className="mt-5 text-[17px] font-semibold text-ink">Fill it in myself</span>
          <span className="mt-1 text-sm leading-relaxed text-muted">No CV yet? Answer a few short sections instead.</span>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-ink-2">Start <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </button>
      </div>
      <div className="rounded-[14px] border border-line bg-surface-2 p-5">
        <p className="text-[13px] font-medium text-ink">What we&apos;ll cover</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((i) => <li key={i} className="flex items-center gap-2 text-sm text-ink-2"><Check className="size-3.5 text-accent" /> {i}</li>)}
        </ul>
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted"><ShieldCheck className="size-3.5" /> We never store your phone number, e-mail or address in your career profile.</p>
      </div>
    </div>
  );
}

// ── 1. CV upload ────────────────────────────────────────────────
interface Extracted {
  full_name: string; headline: string; education: Draft["education"]; academics: Draft["academics"]; skills: Skill[];
  projects: Draft["projects"]; experience: Draft["experience"]; certifications: Draft["certifications"]; achievements: string[];
  interests: string[]; targetRoles: string[];
}

const uniqueBy = <T,>(items: T[], key: (t: T) => string) => {
  const seen = new Set<string>();
  return items.filter((i) => { const k = key(i).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
};

function mergeCv(draft: Draft, cv: Extracted): Partial<Draft> {
  const fill = <T extends Record<string, unknown>>(base: T, extra: Partial<T>) =>
    Object.fromEntries(Object.entries({ ...extra, ...base }).map(([k, v]) => [k, (v === "" || v === undefined) && extra[k as keyof T] ? extra[k as keyof T] : v])) as T;
  return {
    full_name: draft.full_name || cv.full_name,
    headline: draft.headline || cv.headline,
    education: fill(draft.education as Record<string, unknown>, cv.education as Record<string, unknown>) as Draft["education"],
    academics: {
      strongSubjects: uniqueBy([...(draft.academics.strongSubjects ?? []), ...(cv.academics.strongSubjects ?? [])], (s) => s),
      weakSubjects: uniqueBy([...(draft.academics.weakSubjects ?? []), ...(cv.academics.weakSubjects ?? [])], (s) => s),
      coursework: uniqueBy([...(draft.academics.coursework ?? []), ...(cv.academics.coursework ?? [])], (s) => s),
    },
    skills: uniqueBy([...draft.skills, ...cv.skills], (s) => s.name),
    projects: uniqueBy([...draft.projects, ...cv.projects], (p) => p.title),
    experience: uniqueBy([...draft.experience, ...cv.experience], (e) => `${e.role}${e.organization}`),
    certifications: uniqueBy([...draft.certifications, ...cv.certifications], (c) => c.name),
    achievements: uniqueBy([...draft.achievements, ...cv.achievements], (a) => a),
    interests: { ...draft.interests, areas: uniqueBy([...(draft.interests.areas ?? []), ...cv.interests], (a) => a).slice(0, 20) },
    goals: { ...draft.goals, targetRoles: uniqueBy([...(draft.goals.targetRoles ?? []), ...cv.targetRoles], (r) => r).slice(0, 8) },
  };
}

export function CvStep({ draft, onExtracted }: { draft: Draft; onExtracted: (patch: Partial<Draft>) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [file, setFile] = useState<string>("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ method: string; counts: [string, number][] } | null>(null);
  const [drag, setDrag] = useState(false);

  async function handle(f: File) {
    setFile(f.name);
    setState("working");
    setError("");
    try {
      const payload = await readCv(f, setStage);
      setStage(payload.kind === "text" ? "Understanding your experience" : "Running OCR on the scanned pages");
      const res = await api<{ profile: Extracted; method: string }>("/api/cv/extract", { method: "POST", json: payload.kind === "text" ? { text: payload.text } : { images: payload.images } });
      onExtracted(mergeCv(draft, res.profile));
      setResult({
        method: res.method,
        counts: [["skills", res.profile.skills.length], ["projects", res.profile.projects.length], ["experiences", res.profile.experience.length], ["certifications", res.profile.certifications.length]],
      });
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) void handle(f); }}
        className={cn("card relative flex min-h-72 flex-col items-center justify-center border-dashed p-8 text-center transition-colors", drag && "border-accent bg-accent-soft/40")}
      >
        <input ref={input} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
        {state === "working" ? (
          <>
            <div className="relative grid size-14 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/15" />
              <ScanText className="size-6 text-accent" />
            </div>
            <p className="mt-5 font-medium text-ink">{file}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted"><Loader2 className="size-3.5 animate-spin" /> {stage}…</p>
          </>
        ) : state === "done" && result ? (
          <>
            <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success"><Check className="size-6" /></span>
            <p className="mt-5 font-medium text-ink">{file}</p>
            <p className="mt-1 text-sm text-muted">Read with {result.method === "ocr" ? "vision OCR" : "text extraction"}. Here&apos;s what we found:</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {result.counts.map(([label, n]) => <Badge key={label} tone={n ? "accent" : "neutral"}><span className="num">{n}</span> {label}</Badge>)}
            </div>
            <Button variant="link" className="mt-5" onClick={() => input.current?.click()}>Use a different file</Button>
          </>
        ) : (
          <>
            <span className="grid size-14 place-items-center rounded-full border border-line-strong bg-surface-2 text-ink-2"><FileText className="size-6" /></span>
            <p className="mt-5 text-[17px] font-medium text-ink">Drop your CV here</p>
            <p className="mt-1 text-sm text-muted">PDF, PNG or JPG · up to 8 MB</p>
            <Button className="mt-6" onClick={() => input.current?.click()}><FileUp /> Choose file</Button>
            {state === "error" && <p className="mt-5 flex items-center gap-2 rounded-[10px] bg-danger-soft px-3 py-2 text-sm text-danger"><TriangleAlert className="size-4" /> {error}</p>}
          </>
        )}
      </div>
      <p className="flex items-center gap-2 text-xs text-muted"><ShieldCheck className="size-3.5" /> Text is extracted in your browser. Contact details are removed before the AI reads it, and the file itself is never stored.</p>
    </div>
  );
}

// ── 2. Education ────────────────────────────────────────────────
export function EducationStep({ draft, update }: StepProps) {
  const e = draft.education;
  const set = (k: keyof Draft["education"], v: string) => update({ education: { ...e, [k]: v } });
  const a = draft.academics;
  return (
    <div className="space-y-5">
      <Section title="About you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name"><Input id="name" value={draft.full_name ?? ""} onChange={(ev) => update({ full_name: ev.target.value })} /></Field>
          <Field label="One-line headline" htmlFor="headline" hint="How you'd introduce yourself."><Input id="headline" placeholder="B.Tech CSE (AI & ML) student who loves building ML apps" value={draft.headline ?? ""} onChange={(ev) => update({ headline: ev.target.value })} /></Field>
        </div>
      </Section>
      <Section title="Current education">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Degree" htmlFor="degree"><Input id="degree" placeholder="B.Tech" value={e.degree ?? ""} onChange={(ev) => set("degree", ev.target.value)} /></Field>
          <Field label="Branch / major" htmlFor="branch"><Input id="branch" placeholder="Computer Science (AI & ML)" value={e.branch ?? ""} onChange={(ev) => set("branch", ev.target.value)} /></Field>
          <Field label="Institution" htmlFor="inst" className="sm:col-span-2"><Input id="inst" placeholder="Lovely Professional University" value={e.institution ?? ""} onChange={(ev) => set("institution", ev.target.value)} /></Field>
          <Field label="Current year" htmlFor="year">
            <Select id="year" value={e.currentYear ?? ""} onChange={(ev) => set("currentYear", ev.target.value)}>
              <option value="">Select</option>
              {["1st year", "2nd year", "3rd year", "4th year", "5th year", "Graduated", "Working"].map((y) => <option key={y}>{y}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Graduation" htmlFor="grad"><Input id="grad" inputMode="numeric" placeholder="2028" value={e.graduationYear ?? ""} onChange={(ev) => set("graduationYear", ev.target.value)} /></Field>
            <Field label="CGPA / %" htmlFor="cgpa"><Input id="cgpa" placeholder="8.4" value={e.cgpa ?? ""} onChange={(ev) => set("cgpa", ev.target.value)} /></Field>
          </div>
        </div>
      </Section>
      <Section title="Academics" hint="Subjects drive the 'courses' layer of your roadmap.">
        <div className="space-y-5">
          <Field label="Subjects you've studied"><ChipInput value={a.coursework ?? []} onChange={(v) => update({ academics: { ...a, coursework: v } })} suggestions={COURSEWORK} placeholder="Type a subject and press Enter" /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Strongest subjects"><ChipInput value={a.strongSubjects ?? []} onChange={(v) => update({ academics: { ...a, strongSubjects: v } })} suggestions={(a.coursework ?? []).slice(0, 6)} placeholder="e.g. DBMS" /></Field>
            <Field label="Subjects you find hard"><ChipInput value={a.weakSubjects ?? []} onChange={(v) => update({ academics: { ...a, weakSubjects: v } })} suggestions={(a.coursework ?? []).slice(0, 6)} placeholder="e.g. Computer Networks" /></Field>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── 3. Skills ───────────────────────────────────────────────────
const LEVELS = ["Touched it", "Basics", "Comfortable", "Strong", "Expert"];

function Dots({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={`${label} level`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} title={LEVELS[n - 1]} onClick={() => onChange(n)}
          className={cn("h-2.5 w-5 rounded-full transition-colors", n <= value ? "bg-accent" : "bg-sunken hover:bg-line-strong")} />
      ))}
      <span className="ml-2 w-20 text-xs text-muted">{LEVELS[value - 1]}</span>
    </div>
  );
}

export function SkillsStep({ draft, update }: StepProps) {
  const [name, setName] = useState("");
  const add = (n: string) => {
    const v = n.trim();
    if (!v || draft.skills.some((s) => s.name.toLowerCase() === v.toLowerCase())) return;
    const soft = /communicat|team|leader|speak|problem|manage|present/i.test(v);
    update({ skills: [...draft.skills, { name: v, level: 3, category: soft ? "soft" : "technical" }] });
    setName("");
  };
  const set = (i: number, patch: Partial<Skill>) => update({ skills: draft.skills.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const open = SKILLS.filter((s) => !draft.skills.some((k) => k.name.toLowerCase() === s.toLowerCase())).slice(0, 12);
  return (
    <Section title="Your skills" hint={`${draft.skills.length} added`}>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(name); }}>
        <Input placeholder="Add a skill, tool or language" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="outline"><Plus /> Add</Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {open.map((s) => <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-ink-2 hover:border-accent hover:text-accent">+ {s}</button>)}
      </div>
      <ul className="mt-6 divide-y divide-line border-t border-line">
        {draft.skills.map((s, i) => (
          <li key={s.name} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
            <span className="min-w-36 flex-1 text-[15px] text-ink">{s.name}</span>
            <Dots value={s.level} label={s.name} onChange={(level) => set(i, { level })} />
            <Select value={s.category} onChange={(e) => set(i, { category: e.target.value as Skill["category"] })} className="h-8 w-32 text-[13px]">
              <option value="technical">Technical</option><option value="tool">Tool</option><option value="soft">Soft skill</option><option value="language">Language</option>
            </Select>
            <button type="button" aria-label={`Remove ${s.name}`} onClick={() => update({ skills: draft.skills.filter((_, j) => j !== i) })} className="rounded p-1.5 text-faint hover:bg-sunken hover:text-danger"><Trash2 className="size-4" /></button>
          </li>
        ))}
        {!draft.skills.length && <li className="py-8 text-center text-sm text-muted">No skills yet — add a few above.</li>}
      </ul>
    </Section>
  );
}

// ── 4. Experience ───────────────────────────────────────────────
function Repeater<T>({ items, onChange, empty, render, blank, addLabel }: {
  items: T[]; onChange: (v: T[]) => void; empty: string; blank: T; addLabel: string;
  render: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="relative rounded-[12px] border border-line bg-surface-2 p-4 pr-12">
          {render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))))}
          <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} className="absolute right-3 top-3 rounded p-1.5 text-faint hover:bg-sunken hover:text-danger"><Trash2 className="size-4" /></button>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted">{empty}</p>}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank])}><Plus /> {addLabel}</Button>
    </div>
  );
}

export function ExperienceStep({ draft, update }: StepProps) {
  return (
    <div className="space-y-5">
      <Section title="Projects" hint="Coursework, hackathons, personal builds.">
        <Repeater items={draft.projects} onChange={(projects) => update({ projects })} empty="No projects yet." addLabel="Add project"
          blank={{ title: "", description: "", tech: [], link: "" }}
          render={(p, set) => (
            <div className="grid gap-3">
              <Input placeholder="Project title" value={p.title} onChange={(e) => set({ title: e.target.value })} />
              <Textarea placeholder="What did you build, and what was your part?" value={p.description} onChange={(e) => set({ description: e.target.value })} className="min-h-20" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Tech (comma separated)" value={p.tech.join(", ")} onChange={(e) => set({ tech: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                <Input placeholder="Link (optional)" value={p.link} onChange={(e) => set({ link: e.target.value })} />
              </div>
            </div>
          )} />
      </Section>
      <Section title="Internships & experience">
        <Repeater items={draft.experience} onChange={(experience) => update({ experience })} empty="None yet — that's fine." addLabel="Add experience"
          blank={{ role: "", organization: "", type: "internship", duration: "", description: "" }}
          render={(x, set) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Role" value={x.role} onChange={(e) => set({ role: e.target.value })} />
              <Input placeholder="Organisation" value={x.organization} onChange={(e) => set({ organization: e.target.value })} />
              <Select value={x.type} onChange={(e) => set({ type: e.target.value })}>{["internship", "job", "research", "freelance", "volunteer", "club"].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</Select>
              <Input placeholder="Duration (e.g. Jun–Aug 2026)" value={x.duration} onChange={(e) => set({ duration: e.target.value })} />
              <Textarea placeholder="What did you do?" value={x.description} onChange={(e) => set({ description: e.target.value })} className="min-h-20 sm:col-span-2" />
            </div>
          )} />
      </Section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Certifications">
          <Repeater items={draft.certifications} onChange={(certifications) => update({ certifications })} empty="None added." addLabel="Add"
            blank={{ name: "", issuer: "", year: "" }}
            render={(c, set) => (
              <div className="grid gap-2">
                <Input placeholder="Certificate" value={c.name} onChange={(e) => set({ name: e.target.value })} />
                <div className="grid grid-cols-[1fr_88px] gap-2"><Input placeholder="Issuer" value={c.issuer} onChange={(e) => set({ issuer: e.target.value })} /><Input placeholder="Year" value={c.year} onChange={(e) => set({ year: e.target.value })} /></div>
              </div>
            )} />
        </Section>
        <Section title="Achievements" hint="Hackathons, ranks, publications, awards.">
          <ChipInput value={draft.achievements} onChange={(achievements) => update({ achievements })} placeholder="Type and press Enter" />
        </Section>
      </div>
    </div>
  );
}

// ── 5. Interests (RIASEC) ───────────────────────────────────────
const SCALE = ["Dislike", "Not for me", "Neutral", "Like", "Love"];

export function InterestsStep({ draft, update }: StepProps) {
  const answers = draft.interests.answers ?? {};
  const answer = (id: string, v: number) => {
    const next = { ...answers, [id]: v };
    update({ interests: { ...draft.interests, answers: next, riasec: scoreRiasec(next) } });
  };
  const scores = scoreRiasec(answers);
  const done = Object.keys(answers).length;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <Section title="How would you feel doing this?" hint={`${done} of ${RIASEC_ITEMS.length} answered`}>
          <ol className="space-y-1">
            {RIASEC_ITEMS.map((item, i) => (
              <li key={item.id} className="grid gap-2 border-b border-line py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                <p className="text-[14.5px] text-ink"><span className="num mr-2 text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>{item.text}</p>
                <div className="flex gap-1" role="radiogroup" aria-label={item.text}>
                  {SCALE.map((label, v) => (
                    <button key={label} type="button" role="radio" aria-checked={answers[item.id] === v + 1} title={label} onClick={() => answer(item.id, v + 1)}
                      className={cn("size-8 rounded-full border text-xs transition-all", answers[item.id] === v + 1 ? "border-accent bg-accent text-accent-ink" : "border-line-strong text-muted hover:border-accent hover:text-accent")}>
                      {v + 1}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">1 = dislike · 3 = neutral · 5 = love</p>
        </Section>
        <aside className="card flex flex-col items-center p-6 xl:sticky xl:top-28 xl:self-start">
          <p className="eyebrow self-start">Your interest profile</p>
          <div className="my-4"><Radar values={RIASEC_TYPES.map((t) => ({ label: t.label, value: scores[t.type] }))} /></div>
          <p className="text-center text-sm text-muted">Holland code</p>
          <p className="num text-3xl text-ink">{done >= 6 ? hollandCode(scores) : "—"}</p>
          <ul className="mt-4 w-full space-y-1.5 border-t border-line pt-4">
            {[...RIASEC_TYPES].sort((a, b) => scores[b.type] - scores[a.type]).slice(0, 2).map((t) => (
              <li key={t.type} className="text-xs leading-relaxed text-muted"><span className="font-medium text-ink">{t.label} ({t.type})</span> — {t.blurb}</li>
            ))}
          </ul>
        </aside>
      </div>
      <Section title="Areas that excite you">
        <ChipInput value={draft.interests.areas ?? []} onChange={(areas) => update({ interests: { ...draft.interests, areas } })} suggestions={INTEREST_AREAS} placeholder="e.g. AI for healthcare" />
      </Section>
    </div>
  );
}

// ── 6. Goals ────────────────────────────────────────────────────
const PATHS = [
  { value: "job", label: "Get a job", body: "Placements or off-campus roles" },
  { value: "higher_studies", label: "Higher studies", body: "M.Tech, MS, MBA or research" },
  { value: "entrepreneurship", label: "Build something", body: "Start-up or independent work" },
  { value: "unsure", label: "Not sure yet", body: "Help me find a direction" },
] as const;

export function GoalsStep({ draft, update }: StepProps) {
  const g = draft.goals;
  const set = (patch: Partial<Draft["goals"]>) => update({ goals: { ...g, ...patch } });
  return (
    <div className="space-y-5">
      <Section title="Direction">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PATHS.map((p) => (
            <button key={p.value} type="button" onClick={() => set({ path: p.value })}
              className={cn("rounded-[12px] border p-4 text-left transition-all", g.path === p.value ? "border-accent bg-accent-soft/60 ring-1 ring-accent" : "border-line hover:border-line-strong")}>
              <span className="block text-[15px] font-medium text-ink">{p.label}</span>
              <span className="mt-0.5 block text-[13px] text-muted">{p.body}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Targets" hint="Optional — the matcher will suggest more.">
        <div className="space-y-5">
          <Field label="Roles you're considering"><ChipInput value={g.targetRoles ?? []} onChange={(targetRoles) => set({ targetRoles })} suggestions={ROLES} placeholder="e.g. ML Engineer" /></Field>
          <Field label="Dream companies"><ChipInput value={g.dreamCompanies ?? []} onChange={(dreamCompanies) => set({ dreamCompanies })} suggestions={COMPANIES} placeholder="e.g. Google" /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Industries"><ChipInput value={g.industries ?? []} onChange={(industries) => set({ industries })} suggestions={INDUSTRIES.slice(0, 6)} /></Field>
            <Field label="Preferred locations"><ChipInput value={g.locations ?? []} onChange={(locations) => set({ locations })} suggestions={LOCATIONS.slice(0, 6)} /></Field>
          </div>
        </div>
      </Section>
      <Section title="Time budget" hint="This sets the pace of your roadmap.">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-baseline justify-between"><span className="text-[13px] font-medium text-ink-2">Hours per week</span><span className="num text-2xl text-ink">{g.hoursPerWeek ?? 12}</span></div>
            <input type="range" min={3} max={40} value={g.hoursPerWeek ?? 12} onChange={(e) => set({ hoursPerWeek: Number(e.target.value) })} className="w-full" aria-label="Hours per week" />
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between"><span className="text-[13px] font-medium text-ink-2">Timeline</span><span className="num text-2xl text-ink">{g.timelineMonths ?? 6}<span className="ml-1 text-sm text-muted">months</span></span></div>
            <input type="range" min={1} max={18} value={g.timelineMonths ?? 6} onChange={(e) => set({ timelineMonths: Number(e.target.value) })} className="w-full" aria-label="Timeline in months" />
          </div>
        </div>
        <Field label="Anything else the planner should know?" className="mt-6"><Textarea placeholder="e.g. I want to prepare for GATE alongside placements" value={g.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} /></Field>
      </Section>
    </div>
  );
}

// ── 7. Analyse ──────────────────────────────────────────────────
const STAGES = ["Reading your profile", "Rating you on 68 O*NET skill & knowledge descriptors", "Adding your RIASEC interests and preparation level", "Scoring 910 occupations with the career matcher"];

export function AnalyzeStep({ draft, onDone }: { draft: Draft; onDone: () => void }) {
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ analysis: ProfileAnalysis; matches: CareerMatch[]; families: FamilyFit[]; model: string } | null>(null);
  const started = useRef(false);

  async function run() {
    setError("");
    setResult(null);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1600);
    try {
      await api("/api/profile", { method: "PUT", json: draft });
      setResult(await api("/api/profile/analyze", { method: "POST", json: { complete: true } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      clearInterval(timer);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  });

  if (error) {
    return (
      <div className="card p-8 text-center">
        <TriangleAlert className="mx-auto size-6 text-danger" />
        <p className="mt-3 font-medium text-ink">The analysis didn&apos;t finish</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <Button className="mt-5" onClick={run}>Try again</Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card p-7">
        <ol className="space-y-4">
          {STAGES.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-3 text-[15px] transition-opacity", i > stage ? "opacity-35" : "opacity-100")}>
              <span className={cn("grid size-6 place-items-center rounded-full border", i < stage ? "border-accent bg-accent text-accent-ink" : "border-line-strong")}>
                {i < stage ? <Check className="size-3.5" /> : i === stage ? <Loader2 className="size-3.5 animate-spin text-accent" /> : null}
              </span>
              <span className={i === stage ? "text-ink" : "text-ink-2"}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const top = result.matches.slice(0, 5);
  return (
    <div className="space-y-5">
      <section className="card p-7">
        <p className="eyebrow">Profile analyst</p>
        <p className="display mt-3 text-[22px] leading-snug text-ink">{result.analysis.summary}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><p className="text-xs font-medium text-muted">Strengths</p><ul className="mt-2 space-y-1.5">{result.analysis.strengths.map((s) => <li key={s} className="flex gap-2 text-sm text-ink-2"><Check className="mt-0.5 size-3.5 shrink-0 text-success" />{s}</li>)}</ul></div>
          <div><p className="text-xs font-medium text-muted">To grow</p><ul className="mt-2 space-y-1.5">{result.analysis.growthAreas.map((s) => <li key={s} className="flex gap-2 text-sm text-ink-2"><ArrowRight className="mt-0.5 size-3.5 shrink-0 text-warm" />{s}</li>)}</ul></div>
        </div>
      </section>
      <section className="card p-7">
        <div className="flex items-baseline justify-between"><p className="eyebrow">Career matcher · top matches</p><span className="text-xs text-faint">O*NET 31.0</span></div>
        <ol className="mt-4 divide-y divide-line">
          {top.map((m, i) => (
            <li key={m.code} className="flex items-center gap-4 py-3.5">
              <span className="num w-5 text-sm text-faint">{i + 1}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium text-ink">{m.title}</p><p className="text-xs text-muted">{m.family}</p></div>
              <div className="w-28"><div className="h-1 rounded-full bg-sunken"><div className="h-full rounded-full bg-accent" style={{ width: `${m.match}%` }} /></div></div>
              <span className="num w-10 text-right text-sm text-ink">{m.match}%</span>
            </li>
          ))}
        </ol>
        <Segmented size="sm" className="mt-5" value="families" onChange={() => {}} options={[{ value: "families", label: `Strongest family: ${result.families[0]?.name} · ${Math.round((result.families[0]?.probability ?? 0) * 100)}%` }]} />
      </section>
      <div className="flex justify-end"><Button size="lg" onClick={onDone}>Open my dashboard <ArrowRight /></Button></div>
    </div>
  );
}
