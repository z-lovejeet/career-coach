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
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.07] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
              Interactive Reasoning
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">Socratic Career Coach</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Placement Mentor
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-lg bg-[#0E111A] border border-white/[0.08]">
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
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white mb-1.5">
              Career & DSA Intelligence Terminal
            </h2>
            <p className="text-xs text-[#8A96AA] max-w-md mb-6 leading-relaxed">
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
                  className="p-3 rounded-lg bg-[#0E111A] border border-white/[0.08] hover:border-blue-500/30 text-left text-xs text-[#8A96AA] hover:text-white transition-all font-mono group flex items-start justify-between gap-2 cursor-pointer"
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
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`relative group max-w-[85%] rounded-xl p-4 ${
                  msg.role === "user"
                    ? "bg-primary text-white font-normal shadow-sm rounded-br-none"
                    : "bg-[#0E111A] border border-white/[0.08] shadow-sm rounded-bl-none text-card-foreground"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.06] text-[10px] font-mono text-[#8A96AA]">
                    <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <Sparkles className="w-3 h-3" /> GPT-OSS 120B
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
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
                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none [&>p]:leading-relaxed [&>pre]:bg-[#07080D] [&>pre]:border [&>pre]:border-white/[0.08] [&>pre]:p-3 [&>pre]:rounded-lg font-sans text-slate-200">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-white mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-xl bg-[#0E111A] border border-white/[0.08] rounded-bl-none">
              <div className="flex items-center gap-2 font-mono text-xs text-blue-400">
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
              className="h-7 px-3 rounded-full border-white/[0.1] bg-[#0E111A] hover:border-blue-500/40 text-[11px] font-mono text-[#8A96AA] hover:text-white cursor-pointer"
              onClick={() => sendMessage(action.text)}
            >
              {action.text}
            </Button>
          ))}
        </div>
      )}

      {/* ─── Input Area ─── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-2 flex items-end gap-2 flex-shrink-0 shadow-sm">
        <Textarea
          placeholder="Ask a technical or architectural question (e.g. 'Explain 0-1 BFS vs Dijkstra with code')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-xs sm:text-sm text-white resize-none min-h-[40px] max-h-[140px] px-3 py-2 placeholder:text-[#64748B]"
        />
        <div className="flex items-center gap-2 pr-1 pb-1">
          <span className="hidden sm:inline font-mono text-[10px] text-[#64748B]">
            Return ↵
          </span>
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className="h-8.5 px-3.5 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs disabled:opacity-40 transition-all cursor-pointer shadow-sm"
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
  );
}
