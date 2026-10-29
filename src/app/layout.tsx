import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerAI — Autonomous Agentic Placement Mentor",
  description:
    "Autonomous AI career mentor powered by 7 proactive agents. Real-time resume extraction, placement readiness scoring, bespoke week-by-week roadmaps, and adaptive mock interviews.",
  keywords: [
    "AI career coach",
    "placement preparation",
    "mock interview",
    "resume parser",
    "autonomous agents",
    "DSA prep",
    "system design",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-blue-500/20 selection:text-blue-300`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
