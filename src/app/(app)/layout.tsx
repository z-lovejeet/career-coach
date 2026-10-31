"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Mic,
  MessageSquare,
  LogOut,
  Menu,
  User,
  Flame,
  Map,
  Sparkles,
  Zap,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CelebrationTracker } from "@/components/ui/celebration-tracker";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tag: "HQ" },
  { title: "Profile Dossier", href: "/profile", icon: User },
  { title: "Daily Practice", href: "/tasks", icon: ListTodo },
  { title: "Company Matches", href: "/companies", icon: Building2 },
  { title: "Prep Roadmap", href: "/roadmap", icon: Map },
  { title: "Mock Interview", href: "/interview", icon: Mic, tag: "AI" },
  { title: "AI Mentor", href: "/chat", icon: MessageSquare, tag: "120B" },
  { title: "Progress Analytics", href: "/progress", icon: Flame },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SidebarContentProps {
  pathname: string;
  userName: string;
  onLogout: () => void;
  onCloseMobile?: () => void;
}

function SidebarContent({
  pathname,
  userName,
  onLogout,
  onCloseMobile,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-[#090B12] border-r border-white/[0.07] text-foreground select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.07]">
        <Link
          href="/"
          className="flex items-center gap-3 group transition-opacity"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/[0.12] shadow-sm flex-shrink-0 bg-blue-600/20 flex items-center justify-center">
            <Image src="/logo.png" alt="CareerAI Logo" fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                CareerAI
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-[#8A96AA] border border-white/[0.06]">
                v2.4
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8A96AA] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Placement
            </span>
          </div>
        </Link>
      </div>

      {/* Model Telemetry Banner */}
      <div className="px-3.5 pt-3.5 pb-1">
        <div className="p-2.5 rounded-lg bg-[#0E111D] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-200 truncate">Groq 120B + Gemini 3.8</p>
              <p className="text-[9px] font-mono text-[#8A96AA] truncate">Dual-AI Reasoning Engine</p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
            LIVE
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
          Candidate Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseMobile?.()}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-500/10 text-white border border-blue-500/25 shadow-[0_1px_8px_rgba(59,130,246,0.15)]"
                  : "text-[#8A96AA] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-blue-400" : "text-[#64748B] group-hover:text-slate-300"
                  }`}
                />
                <span>{item.title}</span>
              </div>
              {item.tag && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "bg-white/[0.05] text-[#8A96AA] border border-white/[0.05]"
                  }`}
                >
                  {item.tag}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-white/[0.07] bg-[#07080E]/60">
        <div className="p-2.5 rounded-lg bg-[#0E111D] border border-white/[0.06] flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName || "Candidate"}</p>
            <div className="flex items-center gap-1 text-[10px] text-[#8A96AA] font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Verified Candidate</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[#8A96AA] hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8 rounded-lg transition-colors"
          onClick={onLogout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Disconnect Session
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch streak for topbar badge
  const { data: streakRes } = useSWR('/api/streak', fetcher, { revalidateOnFocus: false });
  const streak = streakRes?.data?.streak?.current || 0;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Candidate"
        );
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  const currentNav = navItems.find((n) => n.href === pathname);

  return (
    <div className="flex min-h-screen bg-[#08090C] text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent
          pathname={pathname}
          userName={userName}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Surface */}
      <main className="flex-1 lg:ml-[240px] flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#08090C]/85 border-b border-white/[0.07] h-16 px-5 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-lg h-9 w-9 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer text-slate-300">
                <Menu className="w-4 h-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 bg-[#090B12] border-r border-white/[0.07]">
                <SidebarContent
                  pathname={pathname}
                  userName={userName}
                  onLogout={handleLogout}
                  onCloseMobile={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8A96AA] hidden sm:inline font-mono">WORKSPACE</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
              <h1 className="font-semibold text-white tracking-tight text-sm">
                {currentNav?.title || "Command Overview"}
              </h1>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center gap-3">
            {/* Streak Counter with tabular numbers */}
            <Link
              href="/progress"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 hover:bg-orange-500/20 transition-colors text-xs font-mono font-medium"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
              <span className="tabular-nums font-semibold">{streak}</span>
              <span className="text-[10px] text-orange-400/80">DAY STREAK</span>
            </Link>

            {/* AI Mentor Trigger */}
            <Link href="/chat">
              <Button
                size="sm"
                className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-primary hover:bg-blue-500 text-white shadow-[0_2px_10px_rgba(59,130,246,0.3)] gap-1.5 transition-all tactile-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask AI Mentor</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content Canvas */}
        <div className="flex-1 p-5 lg:p-8 max-w-[1340px] w-full mx-auto">
          {children}
        </div>
      </main>

      <CelebrationTracker />
    </div>
  );
}
