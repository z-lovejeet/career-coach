"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  RotateCcw,
  ChevronRight,
  Award,
  Clock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  "React & Frontend",
  "Node.js & Backend",
  "System Design",
  "Database & SQL",
  "Operating Systems",
  "Computer Networks",
  "Object-Oriented Programming",
  "Behavioral & HR",
  "Python & Machine Learning",
];

export default function InterviewPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastEval, setLastEval] = useState<InterviewEvaluation | null>(null);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview");
      const data = await res.json();
      if (data.success) setInterviews(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    if (!topic) {
      toast.error("Please select a topic");
      return;
    }
    setStarting(true);
    try {
      toast.info("🧠 Generating interview questions...");
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
      toast.success("Interview started! Good luck 💪");
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
        toast.success(`Interview complete! Score: ${data.data.interview.overall_score}/100`);
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

  // Active interview view
  if (activeInterview && activeInterview.status !== "completed") {
    const questions = activeInterview.questions as InterviewQuestion[];
    const question = questions[currentQ];
    const answered = (activeInterview.answers as string[]).length;
    const progress = (answered / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{activeInterview.topic}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQ + 1} of {questions.length}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {activeInterview.difficulty}
          </Badge>
        </div>

        <Progress value={progress} className="h-1.5" />

        {/* Question */}
        <motion.div
          key={currentQ}
          className="p-6 rounded-2xl glass-strong"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              Q{currentQ + 1}
            </div>
            <div>
              <Badge variant="outline" className="text-[10px] mb-2">{question?.type}</Badge>
              <p className="text-sm leading-relaxed">{question?.question}</p>
            </div>
          </div>
        </motion.div>

        {/* Answer or Evaluation */}
        {lastEval ? (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Score */}
            <div className={`p-5 rounded-2xl border ${
              lastEval.score >= 7 ? "border-emerald-500/30 bg-emerald-500/5" :
              lastEval.score >= 4 ? "border-amber-500/30 bg-amber-500/5" :
              "border-rose-500/30 bg-rose-500/5"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">Score</span>
                <span className={`text-2xl font-bold ${
                  lastEval.score >= 7 ? "text-emerald-400" :
                  lastEval.score >= 4 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {lastEval.score}/{lastEval.max_score}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{lastEval.feedback}</p>

              {lastEval.topics_covered.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Covered:</p>
                  <div className="flex flex-wrap gap-1">
                    {lastEval.topics_covered.map((t, i) => (
                      <Badge key={i} className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {lastEval.topics_missed.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Missed:</p>
                  <div className="flex flex-wrap gap-1">
                    {lastEval.topics_missed.map((t, i) => (
                      <Badge key={i} variant="outline" className="border-rose-500/20 text-rose-400 text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" /> {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-primary font-medium">💡 Tip: {lastEval.improvement_tip}</p>
              </div>
            </div>

            {/* Next button */}
            {currentQ < questions.length - 1 ? (
              <Button onClick={nextQuestion} className="w-full gradient-primary text-white border-0 gap-2">
                Next Question <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setActiveInterview(null);
                  fetchInterviews();
                }}
                className="w-full gradient-primary text-white border-0 gap-2"
              >
                View Results <Award className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Type your answer here... Be detailed and thorough."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <Button
              onClick={submitAnswer}
              disabled={!answer.trim() || submitting}
              className="w-full gradient-primary text-white border-0 gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Main view — topic selection + history
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Mock Interviews</h1>
        <p className="text-muted-foreground">
          Practice with AI-generated interview questions and get instant feedback
        </p>
      </div>

      {/* Start New Interview */}
      <div className="p-6 rounded-2xl glass-strong">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Start New Interview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Select value={topic} onValueChange={(v) => setTopic(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v || "medium")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={startInterview}
            disabled={starting || !topic}
            className="gradient-primary text-white border-0 gap-2 hover:opacity-90"
          >
            {starting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Start Interview
          </Button>
        </div>
      </div>

      {/* Past Interviews */}
      {interviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Past Interviews</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {interviews.map((interview) => (
              <motion.div
                key={interview.id}
                className="p-4 rounded-xl glass hover:glass-strong transition-all cursor-pointer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (interview.status === "in_progress") {
                    setActiveInterview(interview);
                    setCurrentQ((interview.answers as string[]).length);
                    setAnswer("");
                    setLastEval(null);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-sm">{interview.topic}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(interview.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      interview.status === "completed"
                        ? "text-emerald-400 border-emerald-500/20"
                        : "text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {interview.status}
                  </Badge>
                </div>
                {interview.overall_score !== null && (
                  <div className="flex items-center gap-2">
                    <Progress value={interview.overall_score} className="h-1.5 flex-1" />
                    <span className="text-sm font-bold text-primary">
                      {interview.overall_score}/100
                    </span>
                  </div>
                )}
                {interview.status === "in_progress" && (
                  <p className="text-xs text-amber-400 mt-2">
                    Click to continue • {(interview.answers as string[]).length}/{(interview.questions as InterviewQuestion[]).length} answered
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
