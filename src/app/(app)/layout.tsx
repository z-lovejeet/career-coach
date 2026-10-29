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
    <div className="flex flex-col h-full bg-[#090A0F] border-r border-white/[0.08] text-foreground">
      {/* Brand Header */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-white/[0.08]">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-sm flex-shrink-0 bg-blue-600/20 flex items-center justify-center">
            <Image src="/logo.png" alt="CareerAI Logo" fill className="object-cover" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight block">CareerAI</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous
            </span>
          </div>
        </Link>
      </div>

      {/* Model Indicator Pill */}
      <div className="px-4 pt-3.5 pb-1">
        <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium text-slate-300">Groq GPT-OSS 120B</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
            ONLINE
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseMobile?.()}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/10 text-white border border-blue-500/25 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span>{item.title}</span>
              </div>
              {item.tag && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-white/[0.06] text-slate-400"
                  }`}
                >
                  {item.tag}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-white/[0.08] bg-black/20">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName || "Candidate"}</p>
            <p className="text-[10px] text-muted-foreground font-mono">Candidate Profile</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8 rounded-lg transition-colors"
          onClick={onLogout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Disconnect
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
    <div className="flex min-h-screen bg-[#08090D] text-foreground">
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
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#08090D]/85 border-b border-white/[0.08] h-16 px-5 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-lg h-9 w-9 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer text-slate-300">
                <Menu className="w-4 h-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 bg-[#090A0F] border-r border-white/[0.08]">
                <SidebarContent
                  pathname={pathname}
                  userName={userName}
                  onLogout={handleLogout}
                  onCloseMobile={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground hidden sm:inline">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 hidden sm:inline" />
              <h1 className="font-semibold text-white tracking-tight">
                {currentNav?.title || "Overview"}
              </h1>
            </div>
          </div>

          {/* Right Header Status Bar */}
          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <Link
              href="/progress"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 hover:bg-orange-500/20 transition-colors text-xs font-mono font-medium"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
              <span>{streak}d</span>
            </Link>

            {/* AI Mentor Quick Link */}
            <Link href="/chat">
              <Button
                size="sm"
                className="h-8 px-3 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm gap-1.5 transition-all tactile-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask Mentor</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Canvas */}
        <div className="flex-1 p-5 lg:p-8 max-w-[1300px] w-full mx-auto">
          {children}
        </div>
      </main>

      <CelebrationTracker />
    </div>
  );
}
