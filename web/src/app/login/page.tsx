import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Sign in" };

const STEPS = [
  ["01", "Tell us about you", "Upload your CV or fill in your education, skills, projects and interests."],
  ["02", "Find careers that fit", "A model trained on 910 O*NET occupations ranks the careers you match."],
  ["03", "Get a roadmap", "An agent plans the courses and skills that lead to your chosen career."],
  ["04", "Practise and track", "Timed practice, realistic mock interviews and a mentor — all in one place."],
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="paper-grain relative hidden flex-col justify-between border-r border-line bg-surface-2 p-12 lg:flex">
        <Brand />
        <div className="max-w-md">
          <p className="eyebrow mb-4">Career &amp; education advisor</p>
          <h2 className="display text-[44px] leading-[1.06] text-ink">
            A route from where you are <em className="text-accent">to the work you want.</em>
          </h2>
          <ol className="mt-10 space-y-5">
            {STEPS.map(([n, title, body]) => (
              <li key={n} className="grid grid-cols-[2.25rem_1fr] gap-3">
                <span className="num pt-0.5 text-xs text-faint">{n}</span>
                <div>
                  <p className="text-[15px] font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <Link href="/samples" className="group inline-flex w-fit items-center gap-1.5 text-sm text-ink-2 hover:text-accent">
          See three roadmaps the agent generated <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </aside>
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <div className="lg:hidden"><Brand /></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-faint">Your contact details are never added to your career profile.</p>
      </section>
    </main>
  );
}
