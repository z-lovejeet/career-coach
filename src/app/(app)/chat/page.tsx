"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SuggestedAction {
  text: string;
  action: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 80);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.success) setMessages(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setSuggestedActions([]);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error?.message);

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.data.response,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.data.suggested_actions?.length) {
        setSuggestedActions(data.data.suggested_actions);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to mentor engine");
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-5xl mx-auto">
      {/* ─── Chat Console Header ─── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Interactive Reasoning
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-[11px] text-muted-foreground">Socratic Career Coach</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Placement Mentor
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Groq • openai/gpt-oss-120b</span>
        </div>
      </div>

      {/* ─── Messages Scroll Area ─── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-3 pr-2 scroll-smooth"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <Bot className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Career & DSA Intelligence Terminal
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mb-8 leading-relaxed">
              Powered by Groq 120B reasoning. Ask about algorithm trade-offs, mock interview feedback, resume critique, or salary negotiation strategies.
            </p>

            <div className="grid sm:grid-cols-2 gap-2.5 max-w-xl w-full">
              {[
                "How do I structure a 30-day dynamic programming sprint?",
                "Simulate a Google L4 System Design question",
                "Review my resume's distributed systems bullet points",
                "What are the top DSA patterns asked by Uber & Atlassian?",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion)}
                  className="p-3 rounded-xl bg-[#0C0E16] border border-white/[0.08] hover:border-blue-500/30 text-left text-xs text-slate-300 hover:text-white transition-all font-mono group flex items-start justify-between gap-2"
                >
                  <span>{suggestion}</span>
                  <Zap className="w-3.5 h-3.5 text-blue-400 opacity-60 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative group max-w-[85%] rounded-2xl p-4 sm:p-5 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white font-normal shadow-[0_4px_20px_rgba(59,130,246,0.25)] rounded-br-sm"
                    : "bg-[#0C0E16] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06] text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Sparkles className="w-3 h-3" /> GPT-OSS 120B
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none [&>p]:leading-relaxed [&>pre]:bg-[#07080D] [&>pre]:border [&>pre]:border-white/[0.08] [&>pre]:p-3 [&>pre]:rounded-xl font-sans text-slate-200">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-white mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3.5"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-[#0C0E16] border border-white/[0.08] rounded-bl-sm">
              <div className="flex items-center gap-2.5 font-mono text-xs text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing response via Groq 120B...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── Suggested Action Pills ─── */}
      {suggestedActions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 flex-shrink-0">
          {suggestedActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="h-7 px-3 rounded-full border-white/10 bg-white/[0.03] hover:border-blue-500/40 text-[11px] font-mono text-slate-300"
              onClick={() => sendMessage(action.text)}
            >
              {action.text}
            </Button>
          ))}
        </div>
      )}

      {/* ─── Double-Bezel Input Area ─── */}
      <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex-shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="p-2 rounded-[calc(1rem-0.125rem)] bg-[#0C0E16] flex items-end gap-2">
          <Textarea
            placeholder="Type your question or request (e.g. 'Explain Dijkstra with monotonic queue')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-xs sm:text-sm text-white resize-none min-h-[44px] max-h-[140px] px-3 py-2.5 placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center gap-2 pr-1 pb-1">
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground/50">
              Return ↵
            </span>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
