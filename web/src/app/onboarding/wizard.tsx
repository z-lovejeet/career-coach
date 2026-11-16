"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { CompassMark } from "@/components/brand";
import { Button } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnalyzeStep, CvStep, EducationStep, ExperienceStep, GoalsStep, InterestsStep, SkillsStep, WelcomeStep, type Draft } from "./steps";

const STEPS = [
  { id: "welcome", label: "Welcome", title: "Let's map your route.", body: "Ten minutes now gives the agent everything it needs to plan courses, skills and a career path that are genuinely yours." },
  { id: "cv", label: "CV", title: "Start from your CV.", body: "We read it in your browser. Text PDFs are parsed directly; scanned pages go through OCR. Phone numbers and e-mails are stripped before anything is stored." },
  { id: "education", label: "Education", title: "Where are you in your studies?", body: "Your degree and coursework tell the matcher what preparation level to aim for and which subjects you can build on." },
  { id: "skills", label: "Skills", title: "What can you already do?", body: "Rate yourself honestly. 1 means you've only touched it; 5 means you could teach it. The roadmap only works if this is true." },
  { id: "experience", label: "Experience", title: "What have you built?", body: "Projects, internships and certifications are the strongest evidence you have. Add the ones you'd talk about in an interview." },
  { id: "interests", label: "Interests", title: "What kind of work pulls you in?", body: "Twelve quick reactions build your Holland (RIASEC) interest profile — the same model O*NET uses to describe every occupation." },
  { id: "goals", label: "Goals", title: "Where do you want to go?", body: "Targets and time budget shape the pace of your roadmap. It's fine to be unsure — the matcher will suggest directions." },
  { id: "analyze", label: "Analyse", title: "Let's see where you fit.", body: "The Profile Analyst maps you onto 75 O*NET descriptors, then the career matcher scores you against 910 occupations." },
] as const;

export function Wizard({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => ({
    full_name: initial.full_name ?? "",
    headline: initial.headline ?? "",
    education: initial.education ?? {},
    academics: initial.academics ?? {},
    skills: initial.skills ?? [],
    projects: initial.projects ?? [],
    experience: initial.experience ?? [],
    certifications: initial.certifications ?? [],
    achievements: initial.achievements ?? [],
    interests: initial.interests ?? {},
    goals: { path: "job", hoursPerWeek: 12, timelineMonths: 6, ...(initial.goals ?? {}) },
  }));
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const current = STEPS[step];

  async function save() {
    setSaving(true);
    try {
      await api("/api/profile", { method: "PUT", json: draft });
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (step === 2 && !draft.education.degree?.trim()) return toast.error("Add your degree to continue.");
    if (step >= 2 && step < STEPS.length - 1 && !(await save())) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const body = {
    welcome: <WelcomeStep onCv={() => setStep(1)} onManual={() => setStep(2)} />,
    cv: <CvStep draft={draft} onExtracted={(patch) => { update(patch); toast.success("CV read — check the details on the next steps."); }} />,
    education: <EducationStep draft={draft} update={update} />,
    skills: <SkillsStep draft={draft} update={update} />,
    experience: <ExperienceStep draft={draft} update={update} />,
    interests: <InterestsStep draft={draft} update={update} />,
    goals: <GoalsStep draft={draft} update={update} />,
    analyze: <AnalyzeStep draft={draft} onDone={() => { router.replace("/dashboard"); router.refresh(); }} />,
  }[current.id];

  return (
    <div className="paper-grain min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5"><CompassMark /><span className="display hidden text-lg sm:inline">Career<span className="italic text-accent">Compass</span></span></div>
          <ol className="flex flex-1 items-center gap-1.5" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  disabled={i > step || saving}
                  onClick={() => setStep(i)}
                  className="group block w-full text-left disabled:cursor-default"
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className={cn("block h-[3px] rounded-full transition-colors", i < step ? "bg-accent" : i === step ? "bg-ink" : "bg-line")} />
                  <span className={cn("mt-1.5 hidden text-[11px] lg:block", i === step ? "text-ink" : "text-faint")}>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <span className="num text-xs text-muted">{step + 1}/{STEPS.length}</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16 lg:py-16">
        <div key={`intro-${step}`} className="animate-rise lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-3">Step {step + 1} · {current.label}</p>
          <h1 className="display text-[38px] leading-[1.08] text-ink sm:text-[46px]">{current.title}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{current.body}</p>
        </div>

        <div key={`body-${step}`} className="min-w-0 animate-rise [animation-delay:60ms]">
          {body}
          {step > 0 && step < STEPS.length - 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={saving}><ArrowLeft /> Back</Button>
              <div className="flex items-center gap-3">
                {step === 1 && <Button variant="ghost" onClick={() => setStep(2)}>Skip — I&apos;ll type it</Button>}
                <Button onClick={next} loading={saving} size="lg">
                  {step === STEPS.length - 2 ? <>Review &amp; analyse <Check /></> : <>Continue <ArrowRight /></>}
                </Button>
              </div>
            </div>
          )}
          {step === STEPS.length - 1 && (
            <div className="mt-6"><Button variant="ghost" onClick={() => setStep(STEPS.length - 2)}><ArrowLeft /> Edit goals</Button></div>
          )}
        </div>
      </main>
    </div>
  );
}
