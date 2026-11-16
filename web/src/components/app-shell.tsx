"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpenCheck, Compass, LayoutGrid, LogOut, Menu, MessageCircle, Mic, Moon, Route, Sun, UserRound, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { cn, initials } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase-browser";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/roadmap", label: "Roadmap", icon: Route },
  { href: "/practice", label: "Practice", icon: BookOpenCheck },
  { href: "/interview", label: "Interviews", icon: Mic },
  { href: "/mentor", label: "Mentor", icon: MessageCircle },
];

function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function useTheme() {
  const dark = useSyncExternalStore(subscribeTheme, () => document.documentElement.classList.contains("dark"), () => false);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("cc-theme", next ? "dark" : "light"); } catch {}
  };
  return { dark, toggle };
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Workspace">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] transition-colors",
              active ? "bg-surface text-ink shadow-card ring-1 ring-line" : "text-ink-2 hover:bg-sunken hover:text-ink",
            )}
          >
            <Icon className={cn("size-[17px]", active ? "text-accent" : "text-muted group-hover:text-ink-2")} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ name, subtitle, children }: { name: string; subtitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const router = useRouter();
  const path = usePathname();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const footer = (
    <div className="space-y-1 border-t border-line pt-4">
      <Link href="/profile" onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-sunken", path === "/profile" && "bg-sunken")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{initials(name)}</span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
          <span className="block truncate text-[11px] text-muted">{subtitle || "View profile"}</span>
        </span>
      </Link>
      <div className="flex gap-1 px-1">
        <button onClick={toggle} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted hover:bg-sunken hover:text-ink" aria-label="Toggle colour theme">
          {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />} {dark ? "Light" : "Dark"}
        </button>
        <button onClick={signOut} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted hover:bg-sunken hover:text-ink">
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface-2 px-4 pb-4 pt-6 lg:flex">
        <Brand href="/dashboard" className="px-2" />
        <p className="eyebrow mb-2 mt-9 px-3">Workspace</p>
        <NavLinks />
        <div className="mt-6 rounded-[12px] border border-line bg-surface p-3.5">
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink"><Compass className="size-3.5 text-accent" /> Grounded in O*NET</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">Career matches use a model trained on 910 occupations from the O*NET 31.0 database.</p>
        </div>
        <div className="mt-auto">{footer}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand href="/dashboard" />
        <button onClick={() => setOpen(true)} className="rounded-md p-2 text-ink-2 hover:bg-sunken" aria-label="Open navigation"><Menu className="size-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/30 animate-fade" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-surface-2 p-4 shadow-float animate-rise">
            <div className="mb-6 flex items-center justify-between"><Brand href="/dashboard" /><button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-sunken" aria-label="Close navigation"><X className="size-5" /></button></div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">{footer}</div>
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-11">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}

export function ProfileIcon() {
  return <UserRound />;
}
