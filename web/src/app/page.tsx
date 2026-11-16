"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompassMark } from "@/components/brand";
import { supabaseBrowser } from "@/lib/supabase-browser";

const LINES = ["Reading the O*NET career atlas", "Calibrating the career matcher", "Preparing your workspace"];

/** Loading screen: brand reveal while we check the session, then route onward. */
export default function Splash() {
  const router = useRouter();
  const [line, setLine] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const ticker = setInterval(() => setLine((l) => Math.min(l + 1, LINES.length - 1)), 650);
    const minimum = new Promise((r) => setTimeout(r, 2000));
    const session = supabaseBrowser().auth.getSession().then((res: { data: { session: unknown } }) => res.data.session);
    Promise.all([session, minimum]).then(([s]) => {
      setLeaving(true);
      setTimeout(() => router.replace(s ? "/dashboard" : "/login"), 380);
    });
    return () => clearInterval(ticker);
  }, [router]);

  return (
    <main className={`paper-grain grid min-h-dvh place-items-center transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="flex flex-col items-center text-center">
        <CompassMark spin className="size-20 text-ink" />
        <h1 className="display mt-7 text-[44px] leading-none tracking-tight text-ink animate-rise sm:text-[56px]">
          Career<span className="italic text-accent">Compass</span>
        </h1>
        <p className="mt-3 text-[15px] text-muted animate-rise [animation-delay:120ms]">Courses → skills → career. Planned for you.</p>
        <div className="mt-12 flex items-center gap-3 animate-fade [animation-delay:300ms]">
          <div className="h-px w-40 overflow-hidden bg-line">
            <div className="h-full bg-accent transition-[width] duration-[2000ms] ease-out" style={{ width: leaving ? "100%" : `${((line + 1) / LINES.length) * 85}%` }} />
          </div>
        </div>
        <p key={line} className="mt-3 h-4 text-xs text-faint animate-fade">{LINES[line]}</p>
      </div>
      <p className="absolute bottom-6 text-[11px] text-faint">Career data: O*NET 31.0 Database · U.S. Department of Labor, CC BY 4.0</p>
    </main>
  );
}
