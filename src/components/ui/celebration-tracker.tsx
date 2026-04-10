"use client";

import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CelebrationTracker() {
  const { data: streakRes } = useSWR("/api/streak", fetcher, {
    revalidateOnFocus: true,
  });

  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Track previous state to detect changes
  const prevLevelRef = useRef<number | null>(null);
  const prevStreakRef = useRef<number | null>(null);

  useEffect(() => {
    if (!streakRes?.success || !streakRes.data) return;

    const currentLevel = streakRes.data.xp.level;
    const currentStreak = streakRes.data.streak.current;

    let triggerCelebration = false;

    // Check for level up
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      triggerCelebration = true;
      toast.success(`🎉 Level Up! You reached Level ${currentLevel}!`, {
        duration: 5000,
      });
    }

    // Check for significant streak milestones
    if (prevStreakRef.current !== null && currentStreak > prevStreakRef.current) {
      if (currentStreak === 3) {
        triggerCelebration = true;
        toast.success(`🔥 3-Day Streak! You're building consistency!`);
      } else if (currentStreak === 7) {
        triggerCelebration = true;
        toast.success(`🔥 7-Day Streak! You are ON FIRE!`);
      } else if (currentStreak > 7 && currentStreak % 7 === 0) {
        triggerCelebration = true;
        toast.success(`💎 ${currentStreak}-Day Streak! Unstoppable!`);
      }
    }

    // Update refs
    prevLevelRef.current = currentLevel;
    prevStreakRef.current = currentStreak;

    if (triggerCelebration) {
      setShowConfetti(true);
      // Auto-hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [streakRes]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
    </div>
  );
}
