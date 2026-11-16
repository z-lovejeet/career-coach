"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export function MotionEnvironment({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", stiffness: 270, damping: 28, mass: 0.78 }}
    >
      {children}
    </MotionConfig>
  );
}
