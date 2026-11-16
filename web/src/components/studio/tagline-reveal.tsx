"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const statement =
  "Great engineering interviews are not about memorizing trivia. They are about demonstrating how you reason through architecture, tradeoffs, and code under real constraints.";

const words = statement.split(" ");

export function TaglineReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-15% 0px -15% 0px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={containerRef}
      className="landing-section my-16 sm:my-24 py-12 border-y border-slate-200/80 dark:border-slate-800/80 text-center"
      aria-label="Core Philosophy"
    >
      <div className="max-w-[760px] mx-auto px-4">
        <p className="eyebrow mb-4 text-indigo-600 dark:text-indigo-400">
          The core philosophy
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white leading-snug text-balance">
          {words.map((word, index) => {
            if (prefersReducedMotion) {
              return (
                <span key={`${word}-${index}`} className="inline-block mr-[0.28em] text-slate-900 dark:text-white">
                  {word}
                </span>
              );
            }

            return (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0.28, y: 4 }}
                animate={
                  isInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0.28, y: 4 }
                }
                transition={{
                  duration: 0.45,
                  delay: index * 0.035,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block mr-[0.28em] text-slate-900 dark:text-white"
              >
                {word}
              </motion.span>
            );
          })}
        </h2>
      </div>
    </section>
  );
}
