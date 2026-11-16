"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, GraduationCap, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardHeader, PageHeader, Segmented } from "@/components/ui/primitives";
import { Radar } from "@/components/ui/charts";
import { EducationStep, ExperienceStep, GoalsStep, InterestsStep, SkillsStep, type Draft } from "@/app/onboarding/steps";
import { api } from "@/lib/api";
import { hollandCode, RIASEC_TYPES } from "@/lib/riasec";
import type { CareerMatch, Profile } from "@/lib/types";

type Tab = "overview" | "education" | "skills" | "experience" | "interests" | "goals";

export function ProfileView({ profile, matches, model }: { profile: Profile; matches: CareerMatch[]; model: { version: string; onet: string; metrics: Record<string, number> } }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<Draft>({
    full_name: profile.full_name ?? "", headline: profile.headline ?? "", education: profile.education ?? {}, academics: profile.academics ?? {},
    skills: profile.skills ?? [], projects: profile.projects ?? [], experience: profile.experience ?? [], certifications: profile.certifications ?? [],
    achievements: profile.achievements ?? [], interests: profile.interests ?? {}, goals: profile.goals ?? {},
  });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "analyse" | null>(null);
  const update = (patch: Partial<Draft>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };

  async function save(analyse: boolean) {
    setBusy(analyse ? "analyse" : "save");
    try {
      await api("/api/profile", { method: "PUT", json: draft });
      if (analyse) {
        await api("/api/profile/analyze", { method: "POST", json: {} });
        toast.success("Profile re-analysed — your matches and readiness are updated.");
      } else toast.success("Profile saved.");
      setDirty(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const riasec = draft.interests.riasec ?? {};
  const e = draft.education;
  const props = { draft, update };

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title={draft.full_name || "Your profile"}
        description={draft.headline || [e.degree, e.branch, e.institution].filter(Boolean).join(" · ")}
        actions={<>
          <Button variant="outline" onClick={() => save(false)} loading={busy === "save"} disabled={!!busy || !dirty}><Save /> Save</Button>
          <Button onClick={() => save(true)} loading={busy === "analyse"} disabled={!!busy}><RefreshCw /> Save &amp; re-analyse</Button>
        </>}
      />
      <Segmented<Tab> className="mb-6 flex-wrap" value={tab} onChange={setTab} options={[
        { value: "overview", label: "Overview" }, { value: "education", label: "Education" }, { value: "skills", label: "Skills" },
        { value: "experience", label: "Experience" }, { value: "interests", label: "Interests" }, { value: "goals", label: "Goals" },
      ]} />

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <Card className="p-6">
              <CardHeader title="Profile analyst" description={profile.analysis ? `Updated ${new Date(profile.analysis.analyzedAt).toLocaleDateString("en-IN")} · ${profile.analysis.model.replace("openai/", "")}` : "Not analysed yet"} action={<BrainCircuit className="size-5 text-accent" />} />
              {profile.analysis ? (
                <>
                  <p className="display mt-4 text-[20px] leading-snug text-ink">{profile.analysis.summary}</p>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div><p className="mb-2 text-xs font-medium text-muted">Strengths</p><div className="flex flex-wrap gap-1.5">{profile.analysis.strengths.map((s) => <Badge key={s} tone="success">{s}</Badge>)}</div></div>
                    <div><p className="mb-2 text-xs font-medium text-muted">Growth areas</p><div className="flex flex-wrap gap-1.5">{profile.analysis.growthAreas.map((s) => <Badge key={s} tone="warm">{s}</Badge>)}</div></div>
                  </div>
                </>
              ) : <p className="mt-3 text-sm text-muted">Run “Save &amp; re-analyse” to generate your assessment.</p>}
            </Card>
            <Card className="p-6">
              <CardHeader title="Education & skills" action={<GraduationCap className="size-5 text-muted" />} />
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted">Programme</dt><dd className="mt-0.5 text-ink">{[e.degree, e.branch].filter(Boolean).join(", ") || "—"}</dd></div>
                <div><dt className="text-xs text-muted">Institution</dt><dd className="mt-0.5 text-ink">{e.institution || "—"}</dd></div>
                <div><dt className="text-xs text-muted">Year</dt><dd className="mt-0.5 text-ink">{e.currentYear || "—"}{e.graduationYear ? ` · graduating ${e.graduationYear}` : ""}</dd></div>
                <div><dt className="text-xs text-muted">CGPA</dt><dd className="num mt-0.5 text-ink">{e.cgpa || "—"}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-line pt-5">
                {draft.skills.map((s) => <span key={s.name} className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-1 text-xs text-ink-2">{s.name}<span className="flex gap-px">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-1.5 w-1 rounded-full ${n <= s.level ? "bg-accent" : "bg-line-strong"}`} />)}</span></span>)}
              </div>
              <p className="mt-4 text-xs text-muted">{draft.projects.length} projects · {draft.experience.length} experiences · {draft.certifications.length} certifications · {draft.achievements.length} achievements</p>
            </Card>
          </div>
          <div className="space-y-5">
            <Card className="flex flex-col items-center p-6">
              <p className="eyebrow self-start">Interest profile (RIASEC)</p>
              <div className="my-3"><Radar values={RIASEC_TYPES.map((t) => ({ label: t.label, value: riasec[t.type] ?? 0 }))} size={230} /></div>
              <p className="num text-2xl text-ink">{Object.keys(riasec).length ? hollandCode(riasec) : "—"}</p>
            </Card>
            <Card className="p-6">
              <CardHeader title="Top career matches" description={`Model ${model.version} · O*NET ${model.onet}`} />
              <ol className="mt-3 space-y-2.5">{matches.slice(0, 5).map((m) => <li key={m.code} className="flex justify-between gap-3 text-sm"><span className="truncate text-ink-2">{m.title}</span><span className="num text-ink">{m.match}%</span></li>)}</ol>
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">Evaluation: {Math.round(model.metrics.familyTop3 * 100)}% top-3 family accuracy, {Math.round(model.metrics.rankingTop5 * 100)}% top-5 occupation retrieval on held-out simulated profiles.</p>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl">
          {tab === "education" && <EducationStep {...props} />}
          {tab === "skills" && <SkillsStep {...props} />}
          {tab === "experience" && <ExperienceStep {...props} />}
          {tab === "interests" && <InterestsStep {...props} />}
          {tab === "goals" && <GoalsStep {...props} />}
          {dirty && <p className="mt-4 text-sm text-warm">Unsaved changes — save, or save &amp; re-analyse to refresh your career matches.</p>}
        </div>
      )}
    </>
  );
}
