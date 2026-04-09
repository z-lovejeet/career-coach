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
  Trash2,
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
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

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setSuggestedActions([]);

    // Optimistic user message
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

      // Replace temp message and add assistant response
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
      toast.error("Failed to send message");
      // Remove optimistic message
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
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Mentor
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personal AI career coach
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scroll-smooth"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Hi! I&apos;m your AI Career Mentor</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Ask me anything about career preparation — DSA strategies, interview tips,
              resume reviews, company-specific advice, or just need motivation!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "How should I prepare for Google interviews?",
                "Create a 30-day DSA study plan",
                "Review my skills for placement readiness",
                "Tips for system design interviews",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "glass"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {suggestedActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => sendMessage(action.text)}
            >
              {action.text}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <Textarea
          placeholder="Ask your AI mentor anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="resize-none min-h-[44px] max-h-[120px]"
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className="gradient-primary text-white border-0 px-4 hover:opacity-90 self-end"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
