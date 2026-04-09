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
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Users,
  BookOpen,
  Mic,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI Profile Analysis",
    description:
      "Upload your resume or enter skills manually. Our AI analyzes your strengths, weaknesses, and generates a readiness score.",
    color: "bg-primary/15 text-primary",
  },
  {
    icon: Building2,
    title: "Company Recommendations",
    description:
      "Get matched with companies based on your current skills. See target companies and what skills you need to reach them.",
    color: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Target,
    title: "Personalized Task Plans",
    description:
      "AI generates daily and weekly tasks tailored to your skill gaps. DSA, web dev, system design — all covered.",
    color: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Track your completion rate, maintain streaks, and watch your readiness score improve over time.",
    color: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: Mic,
    title: "Mock Interviews",
    description:
      "Practice with AI-generated interview questions. Get instant scoring and detailed feedback on your answers.",
    color: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: MessageSquare,
    title: "AI Mentor Chat",
    description:
      "Chat with your AI mentor anytime for career guidance, doubt solving, and personalized advice.",
    color: "bg-violet-500/10 text-violet-400",
  },
];

const stats = [
  { value: "6", label: "AI Agents" },
  { value: "100+", label: "Skill Categories" },
  { value: "Real-time", label: "Adaptation" },
  { value: "∞", label: "Mock Interviews" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CareerAI</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="gradient-primary text-white border-0 hover:opacity-90 transition-opacity gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="gradient-primary text-white border-0 hover:opacity-90 transition-opacity">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Zap className="w-4 h-4" />
              Powered by 6 Specialized AI Agents
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Your AI-Powered</span>
              <br />
              <span className="gradient-text">Career Coach</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Get personalized career roadmaps, smart task plans, mock interviews
              with feedback, and company recommendations — all powered by
              intelligent AI agents that adapt to your progress.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
                <Button
                  size="lg"
                  className="gradient-primary text-white border-0 text-lg px-8 py-6 hover:opacity-90 transition-all"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start Your Journey"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-border hover:bg-accent"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="text-center p-4 rounded-2xl glass"
              >
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Land Your Dream Job</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Six specialized AI agents work together to analyze your profile,
              plan your preparation, and guide you to placement success.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group relative p-6 rounded-2xl glass hover:glass-strong transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200`}
                >
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              How <span className="gradient-text">CareerAI</span> Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Four simple steps to accelerate your placement preparation
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                icon: Users,
                title: "Complete Your Profile",
                description:
                  "Upload your resume, add your skills with self-ratings, list your projects, and set your career goals. Our onboarding captures everything our AI needs.",
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Analyzes Your Profile",
                description:
                  "Six specialized agents evaluate your strengths, identify skill gaps, calculate your readiness score, and match you with suitable companies.",
              },
              {
                step: "03",
                icon: BookOpen,
                title: "Follow Your Personalized Plan",
                description:
                  "Get daily and weekly tasks calibrated to your level. Practice with mock interviews. The AI adapts your plan based on your progress.",
              },
              {
                step: "04",
                icon: TrendingUp,
                title: "Track Progress & Improve",
                description:
                  "Watch your readiness score climb as you complete tasks. Get real-time alerts, streak tracking, and AI-powered course corrections.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex gap-6 items-start p-6 rounded-2xl glass"
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-xl font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-indigo-400" />
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center p-12 rounded-3xl glass-strong relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="relative">
            <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of students using AI-powered guidance to prepare
              smarter and land their dream placements.
            </p>
            <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
              <Button
                size="lg"
                className="gradient-primary text-white border-0 text-lg px-10 py-6 hover:opacity-90"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started — It's Free"}
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold gradient-text">CareerAI</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Built with AI for students, by students
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
