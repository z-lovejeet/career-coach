import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight, BookOpenCheck, ChartNoAxesColumn, Check, Database, FileText, Fingerprint, GitBranch,
  LayoutGrid, Lock, MessageCircle, Mic, Route, ScanText, ShieldCheck, Sparkles, Target, Timer, X,
} from "lucide-react";
import { adminClient, createClient } from "@/server/db/supabase";
import { catalogue } from "@/server/onet/catalogue";
import metrics from "@/server/ml/model/metrics.json";
import { Brand } from "@/components/brand";
import { Badge, buttonClass } from "@/components/ui/primitives";
import { HeroVisual } from "@/components/landing/hero-visual";
import { SplashIntro } from "@/components/landing/splash-intro";
import { SUBJECTS } from "@/lib/subjects";
import type { RoadmapGraph, TraceStep } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "CareerCompass — Courses → skills → career, planned for you" },
  description: "An AI career and education advisor for students. A model trained on 910 O*NET occupations finds careers that fit you; a seven-step agent plans the courses and skills to get there.",
};
export const dynamic = "force-dynamic";

const pct = (v: number) => `${Math.round(v * 100)}%`;

export default async function Landing() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const [{ data: samples }, { count: questionCount }] = await Promise.all([
    supabase.from("roadmaps").select("graph, trace, sample_persona").eq("is_sample", true).eq("status", "active").order("created_at", { ascending: true }).limit(1),
    adminClient().from("practice_questions").select("id", { count: "exact", head: true }),  // aggregate count only
  ]);
  const hero = samples?.[0];
  const occupations = Object.keys(catalogue).length;
  const lr = metrics.B_unseen_occupations["Logistic Regression"];
  const ranking = metrics.D_ranking["cosine only"];
  const topics = SUBJECTS.reduce((s, x) => s + x.topics.length, 0);

  return (
    <>
      <SplashIntro />
      <div className="min-h-dvh">
        {/* ── Navigation ───────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
            <Brand />
            <nav className="hidden items-center gap-7 text-[14px] text-ink-2 md:flex" aria-label="Sections">
              <a href="#how" className="hover:text-ink">How it works</a>
              <a href="#agent" className="hover:text-ink">The agent</a>
              <a href="#model" className="hover:text-ink">The model</a>
              <a href="#features" className="hover:text-ink">Features</a>
              <Link href="/samples" className="hover:text-ink">Samples</Link>
              <a href="#faq" className="hover:text-ink">FAQ</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>Sign in</Link>
              <Link href="/login?mode=signup" className={buttonClass("primary", "sm")}>Get started</Link>
            </div>
          </div>
        </header>

        <main>
          {/* ── Hero ────────────────────────────────────────────── */}
          <section className="paper-grain border-b border-line">
            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
              <div className="animate-rise">
                <Badge tone="accent" className="mb-6"><Database /> Built on O*NET 31.0 · {occupations} occupations</Badge>
                <h1 className="display text-[46px] leading-[1.03] text-ink sm:text-[62px]">
                  Know where you&apos;re going. <em className="text-accent">And exactly how to get there.</em>
                </h1>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
                  CareerCompass reads your background and interests, finds the careers you genuinely fit, and plans the route — which
                  courses to take, which skills they build, and how those skills lead to the role. Not a list of tips. A plan you can follow, edit and track.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link href="/login?mode=signup" className={buttonClass("primary", "lg")}>Build my roadmap <ArrowRight /></Link>
                  <Link href="/samples" className={buttonClass("outline", "lg")}>See sample roadmaps</Link>
                </div>
                <ul className="mt-9 grid max-w-lg grid-cols-1 gap-2.5 text-[14px] text-ink-2 sm:grid-cols-2">
                  {["Upload a CV or fill in a short profile", "Career matches from a trained model", "A seven-step planning agent", "Practice, mock interviews and a mentor"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-accent" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="animate-rise [animation-delay:120ms] lg:pl-6">
                {hero ? <HeroVisual graph={hero.graph as RoadmapGraph} trace={hero.trace as TraceStep[]} persona={hero.sample_persona?.name?.split(" · ")[0]} /> : null}
              </div>
            </div>
          </section>

          {/* ── Numbers ─────────────────────────────────────────── */}
          <section className="border-b border-line bg-surface">
            <div className="mx-auto grid max-w-6xl grid-cols-2 divide-line px-6 md:grid-cols-5 md:divide-x">
              {[
                [occupations.toString(), "O*NET occupations the model can recommend"],
                ["75", "skills, knowledge areas and interests per profile"],
                [pct(lr.top3_accuracy), "top-3 career-family accuracy on unseen occupations"],
                [pct(ranking.top5), "exact career in the top five recommendations"],
                [(questionCount ?? 0).toLocaleString("en-IN"), `practice questions across ${topics} topics`],
              ].map(([n, label]) => (
                <div key={label} className="px-2 py-8 md:px-6">
                  <p className="num text-[30px] text-ink">{n}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Problem ─────────────────────────────────────────── */}
          <section className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="eyebrow">Why this exists</p>
                <h2 className="display mt-3 text-[38px] leading-[1.1] text-ink sm:text-[44px]">Career advice is everywhere. A plan that fits you is not.</h2>
                <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
                  Students piece their future together from seniors, YouTube playlists and placement rumours. The advice is generic,
                  disconnected from what they already know, and rarely says what to do on Monday morning. CareerCompass puts the whole
                  journey — from the subjects you study to the job you want — in one place, and makes every step specific to you.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  ["“Learn DSA and do projects.”", "Which topics, in what order, and how many hours a week can you actually give?", "A phased roadmap sized to your time budget, with a timeline you can tick off."],
                  ["“Data science is booming.”", "Is it right for someone with your interests and background?", "A model trained on O*NET scores how closely you match 910 real occupations."],
                  ["“Just keep practising.”", "Practising what? And how do you know it's working?", "Topic-level accuracy, mock-interview scores and a readiness score that moves as you progress."],
                ].map(([quote, question, answer]) => (
                  <div key={quote} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_1.15fr]">
                    <div>
                      <p className="flex items-start gap-2 text-[15px] font-medium text-ink"><X className="mt-0.5 size-4 shrink-0 text-danger" />{quote}</p>
                      <p className="mt-1.5 pl-6 text-[13px] leading-relaxed text-muted">{question}</p>
                    </div>
                    <p className="flex items-start gap-2 border-t border-line pt-4 text-[14px] leading-relaxed text-ink-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><Check className="mt-0.5 size-4 shrink-0 text-success" />{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How it works ────────────────────────────────────── */}
          <section id="how" className="scroll-mt-20 border-y border-line bg-surface-2">
            <div className="mx-auto max-w-6xl px-6 py-24">
              <p className="eyebrow">How it works</p>
              <h2 className="display mt-3 max-w-2xl text-[38px] leading-[1.1] text-ink sm:text-[44px]">Four steps from “I&apos;m not sure” to a plan you trust.</h2>
              <ol className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
                {[
                  [FileText, "Tell us about you", "Drop in your CV — text PDFs are read in your browser and scanned pages go through OCR — or fill in a short profile. Education, subjects, self-rated skills, projects, internships, a 12-question interest quiz and your goals.", "~8 minutes"],
                  [Target, "See where you fit", "The Profile Analyst maps you onto 75 O*NET descriptors. A supervised model then scores you against every occupation and shows your strongest career families and best-matching roles.", "Instant"],
                  [Route, "Get your roadmap", "Pick a destination. A seven-step agent finds your skill gaps against O*NET's requirements, chooses courses and projects that close them, and sequences them into phases and milestones.", "10–25 seconds"],
                  [ChartNoAxesColumn, "Practise and track", "Timed practice on academic and placement subjects, adaptive mock interviews, a mentor for any question — and a dashboard whose readiness score rises as you finish steps.", "Every day"],
                ].map(([Icon, title, body, time], i) => {
                  const I = Icon as typeof FileText;
                  return (
                    <li key={title as string} className="flex flex-col bg-surface p-7">
                      <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent"><I className="size-[18px]" /></span><span className="num text-xs text-faint">0{i + 1}</span></div>
                      <h3 className="mt-6 text-[17px] font-semibold text-ink">{title as string}</h3>
                      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted">{body as string}</p>
                      <p className="mt-6 flex items-center gap-1.5 text-xs text-ink-2"><Timer className="size-3.5" /> {time as string}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* ── The agent ───────────────────────────────────────── */}
          <section id="agent" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="eyebrow">The roadmap agent</p>
                <h2 className="display mt-3 text-[38px] leading-[1.1] text-ink sm:text-[44px]">Seven specialists, one plan.</h2>
                <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
                  Instead of one model producing one generic answer, the roadmap is built by a pipeline of agents. Each does one job,
                  hands its result to the next, and reports what it did — so you can watch the plan being made and see why every course is there.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge tone="accent">LLM agent · Groq</Badge><Badge tone="warm">Trained ML model</Badge><Badge>O*NET data</Badge><Badge tone="outline">Rules</Badge>
                </div>
                <p className="mt-6 text-[13px] leading-relaxed text-muted">After it&apos;s built you stay in control: edit any step, change your pace, or ask the agent in plain words — “I already know Python”, “compress this to three months” — and preview the change before it&apos;s saved.</p>
              </div>
              <ol className="relative space-y-3">
                {[
                  ["Profile Analyst", "LLM agent", "accent", "Rates you on 68 O*NET skill and knowledge descriptors from your CV, coursework, projects and self-ratings, and writes a short assessment of your strengths and growth areas."],
                  ["Career Matcher", "Trained ML model", "warm", "Adds your RIASEC interests and preparation level, then scores all occupations: logistic regression for career-family fit and similarity ranking for individual roles."],
                  ["Navigator", "Rules", "outline", "Chooses the destination: the career you picked, the closest O*NET title to the role you typed (using official alternate job titles), or your strongest match."],
                  ["Gap Analyzer", "O*NET data", "neutral", "Compares your current level with the level O*NET says the role requires for each key skill, weights it by importance, and lists the technologies the job uses that you don't have yet."],
                  ["Curriculum Planner", "LLM agent", "accent", "Turns the gaps into an ordered set of university subjects, online courses and portfolio projects, each linked to the skills it builds and sized to your hours per week."],
                  ["Roadmap Composer", "LLM agent", "accent", "Sequences everything into phases with goals and checkable milestones, respecting prerequisites and fitting your timeline."],
                  ["Critic", "Rules + LLM", "accent", "Checks every major gap is covered, the plan fits the time available and each skill has something that builds it — and repairs the plan if a check fails."],
                ].map(([name, kind, tone, body], i) => (
                  <li key={name} className="card grid grid-cols-[2.5rem_1fr] gap-4 p-5">
                    <span className="num grid size-9 place-items-center rounded-full border border-line-strong text-sm text-ink-2">{i + 1}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-semibold text-ink">{name}</h3><Badge tone={tone as "accent"}>{kind}</Badge></div>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── The model ───────────────────────────────────────── */}
          <section id="model" className="scroll-mt-20 border-y border-line bg-ink text-canvas dark:bg-surface dark:text-ink">
            <div className="mx-auto max-w-6xl px-6 py-24">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <p className="eyebrow !text-canvas/60 dark:!text-muted">Supervised learning, evaluated honestly</p>
                  <h2 className="display mt-3 text-[38px] leading-[1.1] sm:text-[44px]">A career model you can check.</h2>
                  <p className="mt-5 text-[16px] leading-relaxed opacity-80">
                    O*NET, the U.S. Department of Labor&apos;s occupational database, rates every occupation on the same skills, knowledge
                    areas and interests. We turned {occupations} occupations into {metrics.dataset.features}-feature profiles, simulated{" "}
                    {metrics.dataset.samples.toLocaleString("en-IN")} imperfect student profiles from them, and compared five classifiers.
                  </p>
                  <ul className="mt-7 space-y-3 text-[14px] leading-relaxed opacity-85">
                    <li className="flex gap-2.5"><GitBranch className="mt-0.5 size-4 shrink-0 text-accent" /> Tested on occupations the models never saw — not just new samples of familiar ones.</li>
                    <li className="flex gap-2.5"><Fingerprint className="mt-0.5 size-4 shrink-0 text-accent" /> Robustness measured as student input gets noisier; probabilities calibrated with temperature scaling.</li>
                    <li className="flex gap-2.5"><Sparkles className="mt-0.5 size-4 shrink-0 text-accent" /> The simplest model generalised best, so logistic regression is what runs in the app.</li>
                  </ul>
                </div>
                <div className="overflow-x-auto rounded-[16px] border border-canvas/15 dark:border-line">
                  <table className="w-full min-w-[460px] text-left text-[13.5px]">
                    <thead className="text-[11px] uppercase tracking-wider opacity-60">
                      <tr><th className="px-5 py-4 font-medium">Model</th><th className="px-3 py-4 font-medium">Seen occ. acc.</th><th className="px-3 py-4 font-medium">Unseen occ. acc.</th><th className="px-3 py-4 font-medium">Unseen top-3</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.A_stratified).map(([name, a]) => {
                        const b = metrics.B_unseen_occupations[name as keyof typeof metrics.B_unseen_occupations];
                        const deployed = name === "Logistic Regression";
                        return (
                          <tr key={name} className={`border-t border-canvas/10 dark:border-line ${deployed ? "bg-accent/15" : ""}`}>
                            <td className="px-5 py-3.5">{name}{deployed && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] text-accent-ink">deployed</span>}</td>
                            <td className="num px-3 py-3.5 opacity-80">{pct(a.accuracy)}</td>
                            <td className="num px-3 py-3.5">{pct(b.accuracy)}</td>
                            <td className="num px-3 py-3.5">{pct(b.top3_accuracy)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="border-t border-canvas/10 px-5 py-4 text-[12px] leading-relaxed opacity-60 dark:border-line">
                    k-NN looks best on familiar occupations because it memorises near-duplicates, then falls behind on new ones. Individual
                    roles are ranked by similarity: the exact occupation appears in the top five {pct(ranking.top5)} of the time.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Features ────────────────────────────────────────── */}
          <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
            <p className="eyebrow">Everything in one workspace</p>
            <h2 className="display mt-3 max-w-2xl text-[38px] leading-[1.1] text-ink sm:text-[44px]">From the first plan to the final interview.</h2>
            <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                [Route, "Interactive roadmap", "A map of courses → skills → career and a phase-by-phase timeline. Tick off steps, reorder, add your own, change your pace, ask the agent for changes or suggestions, and restore any earlier version.", ["Course search links on NPTEL, Coursera, YouTube", "Version history", "AI suggestions from your progress"]],
                [LayoutGrid, "Readiness dashboard", "One honest number for how ready you are for your target role — built from O*NET requirement coverage, practice accuracy, interview scores and roadmap progress — plus what to do next.", ["Career matches and family fit", "Companies to aim for", "XP, level and streak"]],
                [BookOpenCheck, "Real-time practice", `${SUBJECTS.filter((s) => s.group === "academic").length} university subjects and ${SUBJECTS.filter((s) => s.group === "placement").length} placement sections. Timed questions, graded instantly on the server with an explanation for every answer.`, ["DSA, OS, DBMS, CN, OOP, ML, maths", "Quant, logical, verbal, code output", "Weak topics feed your next actions"]],
                [Mic, "Mock interviews", "Choose the company, role, difficulty and type. The interviewer probes when you're vague and moves on when you're solid, then the panel scores you on five dimensions.", ["Answer by voice or typing", "Stronger-answer outline per question", "Hire / no-hire verdict"]],
                [MessageCircle, "Mentor", "Ask anything about careers, placements, higher studies or any CS subject. The mentor looks up O*NET, your matches, your progress and your roadmap before it answers.", ["Answers stream as they're written", "Saved conversations", "Shows which sources it checked"]],
                [ScanText, "CV that fills itself", "Upload a PDF or a photo. Text is extracted in your browser; scanned pages are read with vision OCR. You review and edit everything before it's saved.", ["Skills, projects, internships, certifications", "Phone and e-mail removed automatically", "The file itself is never stored"]],
              ].map(([Icon, title, body, bullets]) => {
                const I = Icon as typeof Route;
                return (
                  <article key={title as string} className="card flex flex-col p-7">
                    <span className="grid size-10 place-items-center rounded-[11px] border border-line bg-surface-2 text-ink"><I className="size-[18px]" /></span>
                    <h3 className="mt-6 text-[17px] font-semibold text-ink">{title as string}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{body as string}</p>
                    <ul className="mt-5 space-y-1.5 border-t border-line pt-5">
                      {(bullets as string[]).map((b) => <li key={b} className="flex items-start gap-2 text-[13px] text-ink-2"><Check className="mt-0.5 size-3.5 shrink-0 text-accent" />{b}</li>)}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ── Audience + privacy ──────────────────────────────── */}
          <section className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="card p-8">
                <p className="eyebrow">Made for Indian students</p>
                <h3 className="display mt-3 text-[30px] leading-tight text-ink">Whatever your branch, whatever your year.</h3>
                <ul className="mt-6 space-y-4">
                  {[
                    ["Engineering students", "Placement preparation, internships and core vs. software decisions — with practice for the tests companies actually run."],
                    ["Non-engineering students", "BBA, B.Com, B.Sc and more: the model covers 22 career families, from design and finance to healthcare and research."],
                    ["Higher-studies aspirants", "Tell the planner you're aiming for M.Tech, MS or MBA and it factors in the preparation those paths need."],
                    ["The undecided", "Answer the interest quiz and let the career model suggest directions you may not have considered."],
                  ].map(([t, d]) => <li key={t}><p className="text-[15px] font-medium text-ink">{t}</p><p className="mt-0.5 text-[14px] leading-relaxed text-muted">{d}</p></li>)}
                </ul>
              </div>
              <div className="card p-8">
                <p className="eyebrow">Privacy by design</p>
                <h3 className="display mt-3 text-[30px] leading-tight text-ink">Your career data, and nothing more.</h3>
                <ul className="mt-6 space-y-4">
                  {[
                    [ShieldCheck, "No contact details", "Phone numbers, e-mail and addresses are stripped from your CV before the AI reads it, and the profile has nowhere to store them."],
                    [FileText, "Your CV stays with you", "Text is extracted in your browser. The file itself is never uploaded to storage."],
                    [Lock, "Private by default", "Row-level security means only you can read your profile, roadmaps, practice and interviews."],
                    [Database, "Transparent sources", "Career facts come from O*NET; course links are real searches, never invented URLs."],
                  ].map(([Icon, t, d]) => {
                    const I = Icon as typeof Lock;
                    return <li key={t as string} className="flex gap-3"><I className="mt-0.5 size-4 shrink-0 text-accent" /><div><p className="text-[15px] font-medium text-ink">{t as string}</p><p className="mt-0.5 text-[14px] leading-relaxed text-muted">{d as string}</p></div></li>;
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────── */}
          <section id="faq" className="scroll-mt-20 border-t border-line bg-surface-2">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="eyebrow">Questions</p>
                <h2 className="display mt-3 text-[38px] leading-[1.1] text-ink sm:text-[44px]">Good to know.</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">Anything else? Sign up and ask the mentor — it knows how the whole system works.</p>
              </div>
              <div className="divide-y divide-line border-y border-line">
                {[
                  ["Is it free?", "Yes. CareerCompass runs on free tiers of Groq and Supabase. To stay within them, AI actions have fair hourly limits and repeated work is cached."],
                  ["How accurate are the career matches?", `On occupations the model had never seen, the right career family is in its top three ${pct(lr.top3_accuracy)} of the time, and for individual roles the exact occupation is in the top five ${pct(ranking.top5)} of the time on held-out profiles. Treat matches as well-informed suggestions, not verdicts.`],
                  ["Where does the career data come from?", "From O*NET 31.0, the occupational database maintained by the U.S. Department of Labor. It describes each occupation's skills, knowledge, interests, tasks and technologies, and it's widely used in career research worldwide."],
                  ["Do I need a CV?", "No. You can fill in a short profile instead. A CV just saves time — and you review everything extracted from it before it's saved."],
                  ["Can I change the roadmap the AI makes?", "Completely. Edit, reorder, add or remove steps, change your hours per week, or describe a change in plain words and preview what the agent proposes. Every version is kept, so you can always go back."],
                  ["Which AI models does it use?", "Open models served by Groq: GPT-OSS 120B and 20B and Qwen 3.8 for reasoning and OCR, and Whisper for speech. If one model is busy, requests fall back to the next automatically."],
                  ["Are the company suggestions live job openings?", "No. They're companies known to hire for your target role, with a fit score based on what each screens for and the skills you have. Always check the company's careers page for current openings."],
                ].map(([q, a]) => (
                  <details key={q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium text-ink">
                      {q}<span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 pr-10 text-[14.5px] leading-relaxed text-muted">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── Final CTA ───────────────────────────────────────── */}
          <section className="paper-grain border-t border-line">
            <div className="mx-auto max-w-4xl px-6 py-24 text-center">
              <h2 className="display text-[42px] leading-[1.08] text-ink sm:text-[54px]">Your next semester could have <em className="text-accent">a direction.</em></h2>
              <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted">It takes about ten minutes to set up your profile. The roadmap takes less than half a minute.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/login?mode=signup" className={buttonClass("primary", "lg")}>Create my free account <ArrowRight /></Link>
                <Link href="/samples" className={buttonClass("outline", "lg")}>Explore the samples first</Link>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Brand />
              <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted">A career and education advisor that plans the route from courses to skills to career. Built as a supervised learning project at Lovely Professional University.</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">Product</p>
              <ul className="mt-3 space-y-2 text-[13px] text-muted">
                <li><a href="#how" className="hover:text-ink">How it works</a></li>
                <li><a href="#agent" className="hover:text-ink">The roadmap agent</a></li>
                <li><a href="#model" className="hover:text-ink">The career model</a></li>
                <li><Link href="/samples" className="hover:text-ink">Sample roadmaps</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">Account</p>
              <ul className="mt-3 space-y-2 text-[13px] text-muted">
                <li><Link href="/login?mode=signup" className="hover:text-ink">Create account</Link></li>
                <li><Link href="/login" className="hover:text-ink">Sign in</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <p className="mx-auto max-w-6xl px-6 py-5 text-[11.5px] leading-relaxed text-faint">
              Career data: O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under CC BY 4.0. O*NET® is a trademark of USDOL/ETA. CareerCompass has modified the data and is not endorsed by USDOL/ETA.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
