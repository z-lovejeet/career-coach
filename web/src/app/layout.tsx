import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SceneEnvironment } from "@/components/studio/appearance";
import { MotionEnvironment } from "@/components/studio/motion-environment";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const sans = Manrope({ subsets: ["latin"], variable: "--font-studio", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-numbers", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CareerAI — Technical interview preparation", template: "%s · CareerAI" },
  description: "Build a personal study plan, practice technical interviews, and track your progress toward your next engineering role.",
  openGraph: {
    title: "CareerAI — Technical interview preparation",
    description: "A focused workspace to plan, practice, and measure your progress.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        <MotionEnvironment>
          <SceneEnvironment />
          <TooltipProvider>
            <a className="skip-link" href="#main-content">Skip to content</a>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </MotionEnvironment>
      </body>
    </html>
  );
}
