import Link from "next/link";
import { cn } from "@/lib/utils";

/** Compass rose mark. The needle points north-east: "towards your next role". */
export function CompassMark({ className, spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity="0.22" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" strokeOpacity="0.12" />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1="16" y1="2.8" x2="16" y2="5.4" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" transform={`rotate(${a} 16 16)`} />
      ))}
      <g className={spin ? "origin-center animate-[needle_1.6s_cubic-bezier(.2,.7,.2,1)_both]" : ""} style={{ transformOrigin: "16px 16px" }}>
        <path d="M16 16 L22.6 9.4 L17.6 17.6 Z" fill="var(--accent)" />
        <path d="M16 16 L9.4 22.6 L14.4 14.4 Z" fill="currentColor" fillOpacity="0.55" />
      </g>
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
      <style>{`@keyframes needle{0%{transform:rotate(-200deg)}70%{transform:rotate(12deg)}100%{transform:rotate(0)}}`}</style>
    </svg>
  );
}

export function Brand({ href = "/", className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <CompassMark />
      {!compact && (
        <span className="display text-[21px] leading-none tracking-tight">
          Career<span className="italic text-accent">Compass</span>
        </span>
      )}
    </Link>
  );
}
