"use client";

import {
  ChevronDown,
  Compass,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessagesSquare,
  Route,
  TrendingUp,
  UserRound,
  Voicemail,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { SWRConfig } from "swr";
import { toast } from "sonner";
import { SiteFooter } from "./site-footer";
import { Brand } from "@/components/studio/brand";
import { CelebrationTracker } from "@/components/ui/celebration-tracker";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/roadmap", label: "Roadmap", Icon: Route },
  { href: "/tasks", label: "Practice", Icon: ListChecks },
  { href: "/interview", label: "Interviews", Icon: Voicemail },
  { href: "/chat", label: "Mentor", Icon: MessagesSquare },
  { href: "/companies", label: "Opportunities", Icon: Compass },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
];

const accountCache = { provider: () => new Map() };
const retiredRoadmapKeys = [
  "career_ai_roadmap",
  "roadmap_dreamCompany",
  "roadmap_targetRole",
  "roadmap_timelineMonths",
  "roadmap_hoursPerDay",
  "roadmap_focusAreas",
];

function Navigation({ name, guest }: { name: string; guest: boolean }) {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const mobile = useRef<HTMLDetailsElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const { error } = await createClient().auth.signOut({ scope: "local" });
    if (error) {
      toast.error("We couldn’t sign you out. Please try again.");
      setSigningOut(false);
      return;
    }
    window.location.replace("/");
  }

  const closeMenus = () => {
    if (mobile.current) mobile.current.open = false;
    if (account.current) account.current.open = false;
  };

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !nav.current?.contains(event.target))
        closeMenus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress, {
      passive: true,
    });
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);

  return (
    <header ref={nav} className="studio-frame studio-nav">
      <div
        className="studio-nav-inner glass-raised"
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          const openMenu = [mobile.current, account.current].find(
            (menu) => menu?.open,
          );
          closeMenus();
          openMenu?.querySelector("summary")?.focus();
        }}
      >
        <Brand href="/dashboard" />
        <nav
          className="studio-nav-links studio-workspace-links"
          aria-label="Workspace"
        >
          {navigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="studio-nav-link"
              aria-current={pathname === href ? "page" : undefined}
              onClick={closeMenus}
            >
              {pathname === href && (
                <motion.span
                  className="studio-nav-current"
                  layoutId="workspace-nav-current"
                />
              )}
              <span className="studio-nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <details ref={mobile} className="studio-mobile-nav">
            <summary
              className="studio-mobile-trigger cursor-pointer"
              aria-label="Workspace navigation"
              onClick={() => {
                if (account.current) account.current.open = false;
              }}
            >
              <Menu size={19} aria-hidden />
            </summary>
            <nav aria-label="Workspace" className="studio-menu glass-raised">
              {navigation.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={closeMenus}
                  className="studio-menu-item"
                >
                  <Icon size={16} aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
          </details>
          <details ref={account}>
            <summary
              className="studio-account-trigger cursor-pointer"
              aria-label="Account menu"
              onClick={() => {
                if (mobile.current) mobile.current.open = false;
              }}
            >
              <span className="studio-initial" aria-hidden>
                {name.trim().slice(0, 1).toUpperCase() || "C"}
              </span>
              <ChevronDown
                size={13}
                aria-hidden
                className="hidden text-muted-foreground sm:block"
              />
            </summary>
            <div className="studio-menu glass-raised">
              <div className="max-w-56 px-3 py-2">
                <p className="truncate text-sm font-bold">{name}</p>
                {guest && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Guest workspace
                  </p>
                )}
              </div>
              <Link
                href="/profile"
                aria-current={pathname === "/profile" ? "page" : undefined}
                onClick={closeMenus}
                className="studio-menu-item"
              >
                <UserRound size={16} aria-hidden />
                Profile
              </Link>
              <button
                type="button"
                className="studio-menu-item"
                onClick={signOut}
                disabled={signingOut}
              >
                <LogOut size={16} aria-hidden />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function WorkspaceShell({
  children,
  name,
  guest,
}: {
  children: ReactNode;
  name: string;
  guest: boolean;
}) {
  useEffect(() => {
    try {
      for (const key of retiredRoadmapKeys) localStorage.removeItem(key);
    } catch {
      // Some browser privacy modes disable storage access.
    }
  }, []);

  return (
    <SWRConfig value={accountCache}>
      <Navigation name={name} guest={guest} />
      <main
        id="main-content"
        tabIndex={-1}
        className="studio-frame studio-main"
      >
        {children}
      </main>
      <SiteFooter workspace />
      <CelebrationTracker />
    </SWRConfig>
  );
}
