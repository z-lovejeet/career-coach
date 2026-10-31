"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  ChevronRight,
  Award,
  Play,
  Check,
  AlertCircle,
  BarChart2,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Interview, InterviewQuestion, InterviewEvaluation } from "@/types";

const topics = [
  "Data Structures & Algorithms",
  "JavaScript & TypeScript",
  "React & Modern Frontend",
  "Node.js & Backend Architecture",
  "System Design & Scalability",
  "Database Engineering & SQL",
  "Operating Systems & Concurrency",
  "Computer Networks & Protocols",
  "Object-Oriented Design & SOLID",
  "Behavioral & Engineering Leadership",
];

export default function InterviewPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastEval, setLastEval] = useState<InterviewEvaluation | null>(null);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch("/api/interview");
      const data = await res.json();
      if (data.success) setInterviews(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startInterview = async () => {
    if (!topic) {
      toast.error("Please select an interview focus area");
      return;
    }
    setStarting(true);
    try {
      toast.info("Synthesizing technical interview round via Groq 120B...");
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, num_questions: 5 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);

      setActiveInterview(data.data);
      setCurrentQ(0);
      setAnswer("");
      setLastEval(null);
      toast.success("Interview session initialized! Good luck.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to start interview");
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !activeInterview) return;
    setSubmitting(true);
    setLastEval(null);

    try {
      const res = await fetch(`/api/interview/${activeInterview.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, question_index: currentQ }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);

      setLastEval(data.data.evaluation);
      setActiveInterview(data.data.interview);

      if (data.data.is_complete) {
        toast.success(`Session completed! Final Score: ${data.data.interview.overall_score}/100`);
        await fetchInterviews();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to evaluate answer");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setCurrentQ(prev => prev + 1);
    setAnswer("");
    setLastEval(null);
  };

  // ─── ACTIVE INTERVIEW VIEW ───
  if (activeInterview && activeInterview.status !== "completed") {
    const questions = activeInterview.questions as InterviewQuestion[];
    const question = questions[currentQ];
    const totalQuestions = questions.length;
    const progressPercent = Math.round(((currentQ) / totalQuestions) * 100);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Terminal Header */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                LIVE INTERVIEW SESSION
              </span>
              <span className="text-[#64748B] text-xs">•</span>
              <span className="font-mono text-[11px] text-[#8A96AA] capitalize">{activeInterview.difficulty} Level</span>
            </div>
            <h2 className="text-base font-bold text-white">{activeInterview.topic}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-mono text-[10px] text-[#8A96AA]">QUESTION</span>
              <p className="font-mono text-base font-bold text-white tabular-nums">{currentQ + 1} / {totalQuestions}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Exit interview session? Current progress will be saved.")) {
                  setActiveInterview(null);
                  fetchInterviews();
                }
              }}
              className="h-8 px-3 border-white/[0.1] text-xs font-mono text-[#8A96AA] hover:text-white cursor-pointer"
            >
              Abort
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#0A0C13] rounded-full overflow-hidden border border-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Prompt Card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs text-blue-400 mb-3">
            <Terminal className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">INTERVIEWER PROMPT</span>
          </div>
          <p className="text-base sm:text-lg text-white font-medium leading-relaxed mb-4">
            {question?.question}
          </p>

          {question?.expected_topics && question.expected_topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.06]">
              {question.expected_topics.map((t, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                >
                  Topic: {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Candidate Response Workspace */}
        {!lastEval ? (
          <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Your Technical Formulation
              </label>
              <span className="text-[11px] font-mono text-[#8A96AA]">
                Markdown & syntax supported
              </span>
            </div>

            <Textarea
              placeholder="Structure your thought process: 1. Clarifying questions & edge cases, 2. High-level architecture or algorithmic approach, 3. Space & Time complexity..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={9}
              className="bg-[#0A0C13] border-white/[0.1] text-xs sm:text-sm text-white font-mono leading-relaxed resize-none focus:border-primary/70 p-3.5 rounded-lg"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-[#8A96AA] tabular-nums">
                Characters: {answer.length}
              </span>
              <Button
                onClick={submitAnswer}
                disabled={!answer.trim() || submitting}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm disabled:opacity-40 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Evaluating via Groq 120B...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit for Evaluation <Send className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Live Evaluation Feedback Dossier */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 space-y-5 shadow-sm"
          >
            {/* Header with Score */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 font-semibold">
                  EVALUATION DOSSIER
                </span>
                <h3 className="text-base font-bold text-white mt-1">Round Nuance Breakdown</h3>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className={`text-3xl font-bold tabular-nums ${
                  lastEval.score >= 80 ? "text-emerald-400" : lastEval.score >= 60 ? "text-blue-400" : "text-amber-300"
                }`}>
                  {lastEval.score}
                </span>
                <span className="text-xs text-[#8A96AA]">/ 100</span>
              </div>
            </div>

            {/* Feedback Summary */}
            <div>
              <p className="text-[10px] font-mono uppercase text-[#8A96AA] mb-1 font-semibold">Feedback Summary</p>
              <p className="text-xs sm:text-sm text-[#D0D6E2] leading-relaxed bg-[#0A0C13] p-4 rounded-lg border border-white/[0.06]">
                {lastEval.feedback}
              </p>
            </div>

            {/* Strengths & Missed Nuances */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#0A0C13] border border-emerald-500/20">
                <span className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2.5">
                  <Check className="w-3.5 h-3.5" /> Topics Successfully Covered
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(lastEval.topics_covered || []).map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0C13] border border-amber-500/20">
                <span className="font-mono text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Key Nuances Missed
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(lastEval.topics_missed || []).map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-300 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {lastEval.improvement_tip && (
              <div className="p-3.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs font-mono text-blue-300">
                <span className="uppercase text-[10px] text-blue-400 font-bold block mb-1">Mentor Improvement Tip:</span>
                {lastEval.improvement_tip}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end pt-1">
              {currentQ + 1 < totalQuestions ? (
                <Button
                  onClick={nextQuestion}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm cursor-pointer"
                >
                  Next Question ({currentQ + 2}/{totalQuestions}) <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setActiveInterview(null);
                    fetchInterviews();
                  }}
                  className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm cursor-pointer"
                >
                  View Final Results <Award className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ─── LOBBY / SETUP VIEW ───
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Technical Simulation
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">Groq 120B Reasoning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Mock Interview Studio
          </h1>
        </div>

        <div className="font-mono text-xs text-[#8A96AA] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E111A] border border-white/[0.08]">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Real-time Nuance Rubric</span>
        </div>
      </div>

      {/* Start Session Setup */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 shadow-sm">
        <h2 className="text-base font-bold text-white mb-1.5">Configure Interview Round</h2>
        <p className="text-xs text-[#8A96AA] mb-5">
          Choose a specialization domain and difficulty caliber. The agent will adapt questions to your profile strengths and gaps.
        </p>

        <div className="grid sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-mono text-[#8A96AA]">Technical Domain</label>
            <Select value={topic} onValueChange={(val) => setTopic(val || "")}>
              <SelectTrigger className="h-10 bg-[#0A0C13] border-white/[0.1] rounded-lg text-xs sm:text-sm text-white">
                <SelectValue placeholder="Select topic domain..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0E111A] border-white/[0.1] text-white text-xs">
                {topics.map(t => (
                  <SelectItem key={t} value={t} className="focus:bg-blue-600 focus:text-white">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-mono text-[#8A96AA]">Difficulty Caliber</label>
            <Select value={difficulty} onValueChange={(val) => setDifficulty(val || "medium")}>
              <SelectTrigger className="h-10 bg-[#0A0C13] border-white/[0.1] rounded-lg text-xs sm:text-sm text-white capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0E111A] border-white/[0.1] text-white text-xs">
                <SelectItem value="easy" className="focus:bg-blue-600">Junior (Easy)</SelectItem>
                <SelectItem value="medium" className="focus:bg-blue-600">Mid-Level (Medium)</SelectItem>
                <SelectItem value="hard" className="focus:bg-blue-600">Senior/FAANG (Hard)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Button
              onClick={startInterview}
              disabled={starting || !topic}
              className="w-full h-10 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Launch Round <Play className="w-3.5 h-3.5 fill-current" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Past Completed Interviews Matrix */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            Historical Interview Dossiers
          </h3>
          <span className="font-mono text-[11px] text-[#8A96AA] tabular-nums">
            {interviews.length} completed rounds
          </span>
        </div>

        {interviews.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 capitalize border border-white/[0.06]">
                      {iv.difficulty}
                    </span>
                    <span className="text-xs text-[#8A96AA] font-mono">
                      {new Date(iv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{iv.topic}</h4>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-[#8A96AA] uppercase block">Score</span>
                    <span className={`text-base font-bold tabular-nums ${
                      (iv.overall_score || 0) >= 75 ? "text-emerald-400" : "text-amber-300"
                    }`}>
                      {iv.overall_score || "—"} / 100
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs font-mono text-[#8A96AA]">
            <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30" />
            No mock interviews conducted yet. Select a topic above to begin.
          </div>
        )}
      </div>
    </div>
  );
}
