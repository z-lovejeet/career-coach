import type { ReactNode } from "react";
import { AlertCircle, ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function WorkspaceHeading({
  label,
  title,
  description,
  actions,
}: {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="eyebrow mb-2">{label}</p>
        <h1 className="workspace-heading text-balance">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-panel min-w-0 p-5 sm:p-7", className)}>
      {children}
    </section>
  );
}

export function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function ActionLink({
  href,
  children,
  variant = "outline",
}: {
  href: string;
  children: ReactNode;
  variant?: "outline" | "default" | "ghost";
}) {
  return (
    <Link href={href} className={buttonVariants({ variant })}>
      {children}
      <ArrowUpRight aria-hidden="true" />
    </Link>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const tones = {
    neutral: "border-border bg-background/75 text-muted-foreground",
    accent: "border-primary/15 bg-primary/8 text-primary",
    success: "border-emerald-700/15 bg-emerald-50 text-emerald-800",
    warning: "border-amber-700/15 bg-amber-50 text-amber-900",
  };

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function IconTile({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid size-10 shrink-0 place-items-center rounded-[13px] border border-primary/12 bg-primary/7 text-primary",
        className,
      )}
    >
      <Icon className="size-[19px]" aria-hidden="true" />
    </span>
  );
}

export function Notice({
  title,
  description,
  icon = AlertCircle,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-background/45 p-5">
      <IconTile icon={icon} />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorNotice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div role="alert">
      <Notice
        title="Something went wrong"
        description={
          error instanceof Error ? error.message : "Please try again."
        }
        action={
          retry && (
            <Button variant="outline" onClick={retry}>
              Try again
            </Button>
          )
        }
      />
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div
      className="workspace-page space-y-6"
      aria-busy="true"
      role="status"
      aria-label="Loading workspace"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 bg-primary/10" />
        <Skeleton className="h-10 w-56 bg-primary/10 sm:w-80" />
        <Skeleton className="h-4 w-3/4 max-w-sm bg-primary/10" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <Skeleton className="h-64 rounded-[22px] bg-primary/8" />
        <Skeleton className="h-64 rounded-[22px] bg-primary/8" />
      </div>
    </div>
  );
}

export function PercentBar({ value, label }: { value: number; label: string }) {
  const percent = clampPercent(value);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-primary/10"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function clampPercent(value: number) {
  return Number.isFinite(value)
    ? Math.round(Math.max(0, Math.min(value, 100)))
    : 0;
}

export function prettyLabel(value?: string | null) {
  return (
    value
      ?.replace(/_/g, " ")
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase()) || ""
  );
}

export function safeHttpUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export const selectClass =
  "h-11 w-full rounded-xl border border-border bg-card/50 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
export const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});
