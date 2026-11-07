"use client";

import {
  MotionConfig,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, type ReactNode } from "react";

const cursorSpring = { stiffness: 360, damping: 30, mass: 0.52 };

function GlassCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const visible = useMotionValue(0);
  const surface = useSpring(0, { stiffness: 220, damping: 26 });
  const squash = useSpring(1, cursorSpring);
  const stretch = useSpring(1, cursorSpring);
  const xFollow = useSpring(x, cursorSpring);
  const yFollow = useSpring(y, cursorSpring);
  const scale = useSpring(1, cursorSpring);
  const angle = useMotionValue(0);
  const offsetX = useTransform(xFollow, (value) => value - 11);
  const offsetY = useTransform(yFollow, (value) => value - 11);
  const auraX = useTransform(xFollow, (value) => value - 80);
  const auraY = useTransform(yFollow, (value) => value - 80);

  useEffect(() => {
    const pointer = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let lastX = 0;
    let lastY = 0;
    let reset: ReturnType<typeof setTimeout>;
    let pressed = false;

    const hide = () => {
      visible.set(0);
      surface.set(0);
      pressed = false;
      document.documentElement.classList.remove("glass-pointer-active");
    };
    const move = (event: PointerEvent) => {
      if (!pointer.matches || event.pointerType !== "mouse") return hide();
      const target = event.target instanceof Element ? event.target : null;
      if (
        !target ||
        target.closest('input,textarea,select,[contenteditable="true"],iframe')
      )
        return hide();

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (!visible.get()) {
        xFollow.jump(event.clientX);
        yFollow.jump(event.clientY);
      } else if (Math.hypot(dx, dy) > 2) {
        angle.set((Math.atan2(dy, dx) * 180) / Math.PI);
        const drag = Math.min(0.31, Math.hypot(dx, dy) / 85);
        stretch.set(1 + drag);
        squash.set(1 - drag * 0.67);
      }
      lastX = event.clientX;
      lastY = event.clientY;
      x.set(lastX);
      y.set(lastY);
      visible.set(1);
      surface.set(target.closest("[data-liquid-surface]") ? 1 : 0);
      document.documentElement.classList.add("glass-pointer-active");
      scale.set(
        pressed
          ? 0.76
          : target.closest("button,a,summary,[role=button]")
            ? 1.36
            : 1,
      );

      clearTimeout(reset);
      reset = setTimeout(() => {
        stretch.set(1);
        squash.set(1);
      }, 45);
    };
    const down = () => {
      pressed = true;
      scale.set(0.76);
    };
    const up = () => {
      pressed = false;
      scale.set(1);
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    pointer.addEventListener("change", hide);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      pointer.removeEventListener("change", hide);
      clearTimeout(reset);
      hide();
    };
  }, [angle, scale, squash, stretch, surface, visible, x, xFollow, y, yFollow]);

  return (
    <>
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        className="absolute pointer-events-none"
      >
        <defs>
          <filter
            id="liquid-cursor-refraction"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".009 .012"
              numOctaves="2"
              seed="4"
              result="flow"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="flow"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <motion.div
        className="liquid-cursor-aura"
        aria-hidden="true"
        style={{
          x: auraX,
          y: auraY,
          opacity: surface,
          scaleX: stretch,
          scaleY: squash,
        }}
      />
      <motion.div
        className="glass-pointer"
        aria-hidden="true"
        style={{ x: offsetX, y: offsetY, opacity: visible, scale }}
      >
        <motion.span
          className="glass-pointer-lens"
          style={{ rotate: angle, scaleX: stretch, scaleY: squash }}
        />
      </motion.div>
    </>
  );
}

export function MotionEnvironment({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", stiffness: 270, damping: 28, mass: 0.78 }}
    >
      {children}
      <GlassCursor />
    </MotionConfig>
  );
}
