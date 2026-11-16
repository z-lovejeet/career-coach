"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";

const lensSpring = { stiffness: 210, damping: 21, mass: 0.75 };

export function ReadinessLens({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const x = useSpring(0, lensSpring);
  const y = useSpring(0, lensSpring);
  const compression = useSpring(1, lensSpring);
  const lightX = useTransform(x, (angle) => angle * 1.7);
  const lightY = useTransform(y, (angle) => angle * -1.7);

  const reset = () => {
    x.set(0);
    y.set(0);
    compression.set(1);
  };

  return (
    <div
      className="readiness-lens-frame"
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - bounds.x) / bounds.width - 0.5) * 18);
        y.set(((event.clientY - bounds.y) / bounds.height - 0.5) * -18);
      }}
      onPointerDown={(event) => {
        if (!reducedMotion && event.pointerType === "mouse") compression.set(0.94);
      }}
      onPointerUp={() => compression.set(1)}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      <motion.div className="readiness-lens" style={{ rotateX: y, rotateY: x, scale: compression }}>
        <motion.span aria-hidden="true" className="readiness-lens-highlight" style={{ x: lightX, y: lightY }} />
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
}
