"use client";

import { useEffect, useState } from "react";
import { CompassMark } from "@/components/brand";

const LINES = ["Reading the O*NET career atlas", "Calibrating the career matcher", "Preparing your route"];

/** Brief brand intro shown once per browser session before the landing page. */
export function SplashIntro() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");
  const [line, setLine] = useState(0);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("cc-intro") === "1"; sessionStorage.setItem("cc-intro", "1"); } catch {}
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = seen || reduce ? 0 : 1900;
    const ticker = setInterval(() => setLine((l) => Math.min(l + 1, LINES.length - 1)), 600);
    const leave = setTimeout(() => setPhase("leaving"), total);
    const gone = setTimeout(() => setPhase("gone"), total + 450);
    return () => { clearInterval(ticker); clearTimeout(leave); clearTimeout(gone); };
  }, []);

  if (phase === "gone") return null;
  return (
    <div aria-hidden className={`paper-grain fixed inset-0 z-50 grid place-items-center bg-canvas transition-opacity duration-500 ${phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <div className="flex flex-col items-center text-center">
        <CompassMark spin className="size-20 text-ink" />
        <p className="display mt-7 text-[44px] leading-none tracking-tight text-ink sm:text-[56px]">Career<span className="italic text-accent">Compass</span></p>
        <p className="mt-3 text-[15px] text-muted">Courses → skills → career. Planned for you.</p>
        <div className="mt-12 h-px w-40 overflow-hidden bg-line">
          <div className="h-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${((line + 1) / LINES.length) * 100}%` }} />
        </div>
        <p className="mt-3 h-4 text-xs text-faint">{LINES[line]}</p>
      </div>
    </div>
  );
}
