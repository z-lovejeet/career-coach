"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  MessagesSquare,
  Mic,
  Plus,
  Route,
  TrendingUp,
} from "lucide-react";
import { Brand } from "@/components/studio/brand";
import { HeroCockpit } from "@/components/studio/hero-cockpit";
import { TaglineReveal } from "@/components/studio/tagline-reveal";
import { SiteFooter } from "@/components/studio/site-footer";
import { openGuestWorkspace } from "@/components/studio/guest-action";

const workflow = [
  {
    Icon: FileText,
    title: "Start with your story",
    description:
      "Bring your skills, experience, projects, and goals together. Add a resume when you want your assessment to reflect the work behind the bullet points.",
    action: "Build your profile",
    href: "/profile",
  },
  {
    Icon: Route,
    title: "Give your time a purpose",
    description:
      "Choose a role, company, and preparation horizon. Turn the gaps in your profile into a clear sequence of weekly milestones and practical exercises.",
    action: "Explore roadmaps",
    href: "/roadmap",
  },
  {
    Icon: Mic,
    title: "Practice thinking out loud",
    description:
      "Work through a technical interview round. Explain your choices, receive feedback on each answer, and return to the parts that need more attention.",
    action: "See interview practice",
    href: "/interview",
  },
  {
    Icon: TrendingUp,
    title: "Notice your progress",
    description:
      "Review completed practice, consistency, and the topics you spend time on. Use that evidence to decide what deserves your attention next.",
    action: "Understand progress",
    href: "/progress",
  },
];

const explorer = [
  {
    id: "plan",
    Icon: Route,
    title: "A plan you can follow",
    hint: "Profile, goals, and a realistic schedule",
    heading: "Know what to work on next.",
    description:
      "A useful study plan starts with the time you actually have. CareerAI connects your starting skills and target role with a week-by-week preparation path.",
    points: [
      "Choose a preparation horizon from one to twelve months.",
      "Balance concepts, hands-on practice, and project work.",
      "See each week’s exercise and the result you should be able to demonstrate.",
      "Return to your saved plan and adjust your direction as your goals evolve.",
    ],
    href: "/roadmap",
    action: "Open the roadmap",
  },
  {
    id: "practice",
    Icon: Mic,
    title: "Practice with feedback",
    hint: "Technical rounds and a patient mentor",
    heading: "Make your reasoning visible.",
    description:
      "Knowing an answer and communicating it are different skills. Use a focused mock interview or an open conversation with your mentor to practice both.",
    points: [
      "Choose a topic and difficulty for a five-question technical round.",
      "Explain your approach, complexity, edge cases, and trade-offs.",
      "Review the concepts you covered and the details you missed.",
      "Save a session, come back later, and revisit the complete answer notebook.",
    ],
    href: "/interview",
    action: "Open interview practice",
  },
  {
    id: "reflect",
    Icon: TrendingUp,
    title: "Progress with perspective",
    hint: "Your activity and the skills behind it",
    heading: "See the work behind the score.",
    description:
      "Use your activity history and completed work to understand how your preparation is developing. Scores are a starting point for reflection and planning.",
    points: [
      "Review recent practice and your activity calendar.",
      "Compare completed tasks across preparation topics.",
      "Understand how task, interview, and assessment activity contributes to experience.",
      "Find a useful next step from your unfinished work and skill gaps.",
    ],
    href: "/progress",
    action: "Open progress",
  },
];

const questions = [
  {
    question: "Where should I start?",
    answer:
      "Start with your profile. Add the skills you use, projects you can discuss, and the kind of role you want. Your first readiness assessment helps you identify a practical starting point for preparation.",
  },
  {
    question: "What can I try as a guest?",
    answer:
      "Guest access opens an individual workspace with a sample engineering profile and practice tasks. You can explore the experience, try the preparation tools, and return in the same browser. Create an account for a workspace tied to your email.",
  },
  {
    question: "How does interview feedback work?",
    answer:
      "Each answer is evaluated against the question’s expected topics. You receive a score out of ten, an explanation, covered and missed concepts, and a specific improvement suggestion. Completed sessions remain available for review.",
  },
  {
    question: "Can I use my own resume?",
    answer:
      "Yes. Add a PDF up to 4 MB to bring your experience into the assessment. You can review the extracted information, update your profile, replace the PDF, or remove it from your workspace.",
  },
  {
    question: "Are company matches guaranteed offers?",
    answer:
      "Company matches are preparation suggestions based on your profile and assessment. Use them to explore suitable roles and identify skills to build. Current hiring requirements and interview decisions belong to each employer.",
  },
  {
    question: "Where do job results come from?",
    answer:
      "The opportunities workspace can show sourced LinkedIn listings when live search is available. Otherwise, it gives you the same search on LinkedIn so you can browse current postings directly. Each view makes its source clear.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const tabList = useRef<HTMLDivElement>(null);
  const detail = explorer[active];

  async function enterGuest() {
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
      return router.push("/auth?mode=guest");
    setGuestLoading(true);
    setError("");
    try {
      await openGuestWorkspace();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Guest access is temporarily unavailable.",
      );
      setGuestLoading(false);
    }
  }

  return (
    <>
      <header className="studio-frame studio-nav">
        <div className="studio-nav-inner glass-raised">
          <Brand />
          <nav aria-label="Site" className="studio-nav-links landing-nav-links">
            <a href="#workflow" className="studio-nav-link">
              How it works
            </a>
          </nav>
          <Link href="/auth" className="studio-link">
            Sign in <ArrowUpRight size={15} aria-hidden />
          </Link>
        </div>
      </header>

      <main id="main-content" className="studio-frame landing-main">
        <section
          className="landing-hero-surface"
          aria-labelledby="landing-title"
        >
          <div className="landing-hero-top">
            <div className="landing-hero-copy space-y-6">
              {/* Eyebrow status indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Engineering interview workspace</span>
              </div>

              {/* Outcome + Audience Headline */}
              <h1 id="landing-title" className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#171b36] dark:text-white max-w-[680px] text-balance leading-[1.08]">
                Master technical interviews
                <br />
                <span className="bg-gradient-to-r from-[#171b36] via-[#353997] to-[#4c50c8] dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  with structured clarity.
                </span>
              </h1>

              {/* Specific Subheadline */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-[640px] text-pretty leading-relaxed">
                Turn your skill gaps into an actionable weekly study plan. Practice realistic mock interviews with rubric evaluations, track your readiness, and prepare with confidence.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/auth?mode=register"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#4c50c8] hover:bg-[#3f43b3] active:scale-[0.98] text-white text-base font-semibold shadow-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-[#4c50c8] focus:ring-offset-2"
                >
                  Start free preparation
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] text-slate-700 dark:text-slate-200 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60"
                  onClick={enterGuest}
                  disabled={guestLoading}
                >
                  {guestLoading ? "Opening workspace…" : "Explore guest workspace"}
                </button>
              </div>

              {/* Proof Signals Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 max-w-[640px]">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>52 week structured curricula</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Rubric evaluated mock rounds</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Zero setup anonymous access</span>
                </div>
              </div>

              {error && (
                <p role="alert" className="max-w-sm text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            {/* Interactive Hero Product Cockpit */}
            <div className="w-full flex items-center justify-center">
              <HeroCockpit />
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="landing-section"
          aria-labelledby="workflow-title"
        >
          <div className="section-heading">
            <p className="eyebrow mb-3">The workflow</p>
            <h2 id="workflow-title">
              A clearer path to interview day.
            </h2>
            <p>
              Less time deciding which tool to open. More time understanding
              your strengths, working on your gaps, and learning how to explain
              your thinking.
            </p>
          </div>
          <div className="workflow-grid">
            {workflow.map(({ Icon, title, description, action, href }) => (
              <article key={title} className="workflow-step">
                <Icon
                  size={24}
                  className="text-primary"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={href}>
                  {action}
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <TaglineReveal />

        <section
          id="workspace"
          className="landing-section"
          aria-labelledby="workspace-title"
        >
          <div className="section-heading">
            <p className="eyebrow mb-3">Inside the workspace</p>
            <h2 id="workspace-title">
              Give your next step a little structure.
            </h2>
            <p>
              Move between planning, practice, and reflection. Each part is
              useful on its own, and more useful when it connects to the others.
            </p>
          </div>
          <div className="workspace-explorer">
            <div
              ref={tabList}
              className="explorer-tabs"
              role="tablist"
              aria-label="Explore the workspace"
              aria-orientation="vertical"
              onKeyDown={(event) => {
                if (
                  ![
                    "ArrowDown",
                    "ArrowUp",
                    "ArrowLeft",
                    "ArrowRight",
                    "Home",
                    "End",
                  ].includes(event.key)
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? explorer.length - 1
                      : (active +
                          (["ArrowUp", "ArrowLeft"].includes(event.key)
                            ? -1
                            : 1) +
                          explorer.length) %
                        explorer.length;
                setActive(next);
                tabList.current
                  ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
                  [next]?.focus();
              }}
            >
              {explorer.map(({ id, Icon, title, hint }, index) => (
                <button
                  type="button"
                  key={id}
                  id={`tab-${id}`}
                  aria-controls={`panel-${id}`}
                  aria-selected={active === index}
                  tabIndex={active === index ? 0 : -1}
                  role="tab"
                  className="explorer-tab"
                  onClick={() => setActive(index)}
                >
                  <Icon
                    size={21}
                    className="shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>
                    <strong>{title}</strong>
                    <small>{hint}</small>
                  </span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={detail.id}
                role="tabpanel"
                id={`panel-${detail.id}`}
                aria-labelledby={`tab-${detail.id}`}
                tabIndex={0}
                className="explorer-detail glass-inset"
                initial={{ opacity: 0.6, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <h3>{detail.heading}</h3>
                <p>{detail.description}</p>
                <ul>
                  {detail.points.map((point) => (
                    <li key={point}>
                      <Check
                        size={15}
                        className="mt-1 shrink-0 text-primary"
                        aria-hidden
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href={detail.href} className="studio-button">
                  {detail.action}
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section
          id="practice"
          className="landing-section"
          aria-labelledby="practice-title"
        >
          <div className="section-heading">
            <p className="eyebrow mb-3">Make the practice count</p>
            <h2 id="practice-title">
              Prepare for the work.
              <br />
              And the conversation.
            </h2>
            <p>
              Technical interviews ask you to solve a problem and bring someone
              else along with your reasoning. Build a routine that gives both
              skills room to grow.
            </p>
          </div>
          <div className="practice-paths">
            <article className="glass-inset">
              <BookOpen size={24} className="text-primary mb-5" aria-hidden />
              <h3>Depth, one topic at a time.</h3>
              <p>
                Use weekly tasks to move from reading about a concept to
                implementing it, checking the edge cases, and explaining the
                decisions you made.
              </p>
              <ul>
                {[
                  "Data structures, algorithms, and problem solving",
                  "Frontend, backend, and database fundamentals",
                  "System design, trade-offs, and architecture",
                  "Projects that make your experience concrete",
                ].map((item) => (
                  <li key={item}>
                    <Check
                      size={14}
                      className="mt-1 shrink-0 text-primary"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/tasks" className="studio-link -ml-4 mt-4">
                Explore practice
                <ArrowUpRight size={15} aria-hidden />
              </Link>
            </article>
            <article className="glass-inset">
              <MessagesSquare
                size={24}
                className="text-primary mb-5"
                aria-hidden
              />
              <h3>A place to ask the next question.</h3>
              <p>
                Your mentor uses your profile and recent conversation to help
                you reason through a problem. Ask for a hint, test an
                explanation, or plan a study session when you feel stuck.
              </p>
              <blockquote className="my-5 border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-muted-foreground">
                “Help me explain the trade-offs in my approach before you show
                me the solution.”
              </blockquote>
              <p className="text-xs">
                An example prompt to bring to your next practice session.
              </p>
              <Link href="/chat" className="studio-link -ml-4 mt-4">
                Meet your mentor
                <ArrowUpRight size={15} aria-hidden />
              </Link>
            </article>
          </div>
        </section>

        <section
          id="questions"
          className="landing-section"
          aria-labelledby="questions-title"
        >
          <div className="section-heading">
            <p className="eyebrow mb-3">Before you begin</p>
            <h2 id="questions-title">A few things you might be wondering.</h2>
            <p>
              Start with the tools that meet you where you are. You can add
              detail and shape your preparation as you go.
            </p>
          </div>
          <div className="faq-grid">
            {questions.map(({ question, answer }) => (
              <details className="faq-item" key={question}>
                <summary>
                  {question}
                  <Plus size={16} aria-hidden />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
