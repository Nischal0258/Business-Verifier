"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI company research assistant. Ask me anything about companies, trust scores, opportunities, or reviews!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await apiClient.post("/api/v1/students/chat", { query: userMessage.content });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your request right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <header className="py-6 px-6 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glow)" }}>
            <Bot className="w-5 h-5" style={{ color: "var(--accent-purple-light)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Company Insights AI</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Student-focused company research</p>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === "user" ? "bg-blue-600" : "bg-gradient-to-br from-purple-600 to-purple-700"}`}
              >
                {msg.role === "user" ? <User className="w-4 h-4 text-white" : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--bg-card)] border border-[var(--border-subtle)]"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent-purple)" }} />
              <span className="text-sm">Thinking...</span>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="p-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a company, trust scores, or opportunities..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300"
            style={{ background: "linear-gradient(to right, var(--accent-purple), var(--accent-violet))" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
