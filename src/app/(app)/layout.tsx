"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", href: "/profile", icon: User },
  { title: "Tasks", href: "/tasks", icon: ListTodo },
  { title: "Companies", href: "/companies", icon: Building2 },
  { title: "Roadmap", href: "/roadmap", icon: Map },
  { title: "Interview", href: "/interview", icon: Mic },
  { title: "AI Mentor", href: "/chat", icon: MessageSquare },
  { title: "Progress", href: "/progress", icon: Flame },
];

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

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User");
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-border/50 hover:opacity-80 transition-opacity">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <Image src="/logo.png" alt="CareerAI Logo" fill className="object-cover" />
        </div>
        <span className="text-base font-bold tracking-tight">CareerAI</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground">Student</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive text-xs h-8"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col bg-sidebar border-r border-border/50 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-[240px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border/50 h-16 px-6 flex items-center justify-between">
          {/* Mobile */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-lg h-9 w-9 hover:bg-accent transition-colors cursor-pointer">
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 bg-sidebar border-r border-border/50">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-sm font-semibold">
              {navItems.find(n => n.href === pathname)?.title || ""}
            </h1>
          </div>

          {/* Right side minimal */}
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
