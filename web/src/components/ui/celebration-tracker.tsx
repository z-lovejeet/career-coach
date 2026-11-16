"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import useSWR from "swr";
import { toast } from "sonner";
import { request } from "@/components/workspace/api";

type Milestones = { xp: { level: number }; streak: { current: number } };

export function CelebrationTracker() {
  const { data } = useSWR("/api/streak", request<Milestones>);
  const previous = useRef<{ level: number; streak: number } | null>(null);
  const [burst, setBurst] = useState(0);
  const reducedMotion = useReducedMotion();

  const level = data?.xp.level;
  const streak = data?.streak.current;

  useEffect(() => {
    if (level === undefined || streak === undefined) return;
    const old = previous.current;
    previous.current = { level, streak };
    if (!old) return;

    const milestone = streak === 3 || (streak > 0 && streak % 7 === 0);
    const message = level > old.level
      ? `You reached level ${level}.`
      : milestone && streak > old.streak ? `${streak}-day practice streak.` : null;
    if (!message) return;
    toast.success(message);
    const timer = setTimeout(() => setBurst((value) => value + 1), 0);
    return () => clearTimeout(timer);
  }, [level, streak]);

  if (!burst || reducedMotion) return null;

  return (
    <div key={burst} aria-hidden="true" className="pointer-events-none fixed right-9 bottom-16 z-50 h-4 w-4">
      {Array.from({ length: 8 }, (_, index) => {
        const angle = Math.PI * 2 * index / 8;
        return (
          <motion.span
            key={index}
            className="absolute size-2 rounded-full border border-white bg-primary/60 shadow-sm"
            initial={{ x: 0, y: 0, scale: 0.5, opacity: 0.9 }}
            animate={{ x: Math.cos(angle) * 38, y: Math.sin(angle) * 40, scale: 1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 135, damping: 18, opacity: { type: "tween", duration: 0.65 } }}
          />
        );
      })}
    </div>
  );
}
