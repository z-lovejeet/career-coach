"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Brain,
  Target,
  BarChart3,
  MessageSquare,
  Building2,
  ArrowRight,
  Sparkles,
  Mic,
  LayoutDashboard,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Brain, title: "AI Profile Analysis", desc: "Upload your resume. AI extracts skills, rates readiness, identifies gaps automatically." },
  { icon: Building2, title: "Company Matching", desc: "Get matched with companies that fit your skillset. See exactly what you need to reach each one." },
  { icon: Target, title: "Smart Task Plans", desc: "Daily and weekly tasks calibrated to your skill gaps — DSA, dev, system design, all covered." },
  { icon: BarChart3, title: "Progress Tracking", desc: "Streaks, XP system, readiness scores. Watch yourself improve with visual analytics." },
  { icon: Mic, title: "Mock Interviews", desc: "AI-generated interview questions with instant scoring, feedback, and improvement tips." },
  { icon: MessageSquare, title: "AI Mentor", desc: "Chat with your personal AI career mentor anytime for guidance and doubt solving." },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const cta = isLoggedIn ? "/dashboard" : "/auth";
  const ctaText = isLoggedIn ? "Go to Dashboard" : "Start Free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">CareerAI</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="gradient-primary text-white border-0 gap-2 h-9 px-4 text-sm hover:opacity-90">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth"><Button variant="ghost" className="text-muted-foreground text-sm h-9">Sign in</Button></Link>
                <Link href="/auth"><Button className="gradient-primary text-white border-0 h-9 px-4 text-sm hover:opacity-90">Get started <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Background glow — subtle, single, centered */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-8">
              <Zap className="w-3.5 h-3.5" />
              Powered by 6 AI Agents
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Your placement prep,{" "}
            <span className="gradient-text">reimagined.</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Personalized roadmaps, skill analysis, mock interviews, and company recommendations — adapting to your progress in real time.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href={cta}>
              <Button size="lg" className="gradient-primary text-white border-0 text-base px-8 h-12 hover:opacity-90 transition-all">
                {ctaText} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12 border-border/80 hover:bg-accent"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              See features
            </Button>
          </motion.div>

          {/* Stat chips */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { label: "6 AI Agents", color: "text-primary border-primary/20" },
              { label: "100+ Skills", color: "text-emerald-400 border-emerald-500/20" },
              { label: "Real-time Adaptation", color: "text-amber-400 border-amber-500/20" },
              { label: "Unlimited Interviews", color: "text-rose-400 border-rose-500/20" },
            ].map((s, i) => (
              <span key={i} className={`px-3 py-1 rounded-full border text-xs ${s.color}`}>{s.label}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to <span className="gradient-text">land your dream job</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Six specialized AI agents work together to get you placement-ready.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="group p-6 rounded-xl glass hover:border-primary/20 transition-all duration-300"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14 tracking-tight">How it works</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border hidden sm:block" />
            <div className="space-y-8">
              {[
                { num: "1", title: "Complete your profile", desc: "Upload your resume, add skills with self-ratings, set career goals. Our onboarding captures everything." },
                { num: "2", title: "AI analyzes everything", desc: "Six agents evaluate strengths, identify gaps, calculate readiness, and match you with companies." },
                { num: "3", title: "Follow your plan", desc: "Get daily tasks, practice with mock interviews, chat with your AI mentor. Plans adapt to your progress." },
                { num: "4", title: "Track & improve", desc: "Watch your score climb. Get streaks, XP, and proactive alerts when you fall behind." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex gap-5 items-start"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0 z-10">
                    {item.num}
                  </div>
                  <div className="pb-6">
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-2xl mx-auto text-center p-10 rounded-2xl glass-strong relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Ready to accelerate your career?</h2>
            <p className="text-muted-foreground mb-8">Free to use. Start in under 2 minutes.</p>
            <Link href={cta}>
              <Button size="lg" className="gradient-primary text-white border-0 text-base px-8 h-12 hover:opacity-90">
                {ctaText} <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">CareerAI</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Built with AI for students, by students
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CareerAI</p>
        </div>
      </footer>
    </div>
  );
}
