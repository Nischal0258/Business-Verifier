"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, ArrowLeft, Bot, User, Sparkles, AlertTriangle, CheckCircle, Mail, Copy, Check, FileText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatCanvasPage() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI Crew Manager. I can run vibe checks on job descriptions, draft direct outreach emails, or help you compare startups. What do you need?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canvasState, setCanvasState] = useState<"idle" | "vibe" | "outreach" | "comparison" | "companies">("idle");
  const [canvasData, setCanvasData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const detectCanvasIntent = (userText: string, botResponse: string) => {
    const lowerText = userText.toLowerCase();
    
    if (lowerText.includes("vibe") || lowerText.includes("red flag") || lowerText.includes("analyze") || lowerText.includes("jargon")) {
      setCanvasState("vibe");
      setCanvasData({
        text: botResponse,
        flags: [
          { type: "red", text: "Fast-paced environment", translation: "Understaffed and high stress." },
          { type: "red", text: "Competitive salary", translation: "Likely below market average, unwilling to disclose upfront." },
          { type: "green", text: "Mentorship program", translation: "Invests in junior talent and growth." },
          { type: "green", text: "Flexible hours", translation: "Focuses on output rather than strict screen time." }
        ]
      });
    } else if (lowerText.includes("outreach") || lowerText.includes("email") || lowerText.includes("bypass") || lowerText.includes("dm")) {
      setCanvasState("outreach");
      setCanvasData({
        subject: "Passionate Student Developer | Inquiry about Engineering Internship",
        body: `Hi [Name],\n\nI noticed the recent posting for the Engineering Internship at [Company]. While I plan to apply through the portal, I wanted to reach out directly because I deeply resonate with your mission to [Mission].\n\nI recently built [Project], which uses a similar stack to yours, and I would love the opportunity to contribute to your team this summer.\n\nAre you open to a brief 10-minute chat next week?\n\nBest,\n[Your Name]`
      });
    } else if (lowerText.includes("compare") || lowerText.includes("vs")) {
      setCanvasState("comparison");
    } else {
      // Keep existing state or reset if completely unrelated
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      let botResponse = data.response || "Something went wrong.";
      
      // Check for company cards
      const companyCardRegex = /\[COMPANY_CARD:\s*(\{.*?\})\s*\]/g;
      const cards = [];
      let match;
      while ((match = companyCardRegex.exec(botResponse)) !== null) {
        try {
          cards.push(JSON.parse(match[1]));
        } catch (e) {
          console.error("Failed to parse company card JSON", e);
        }
      }
      
      // Strip the raw JSON block from the text response
      botResponse = botResponse.replace(companyCardRegex, "").trim();

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: "bot" }]);
      
      if (cards.length > 0) {
        setCanvasState("companies");
        setCanvasData({ cards });
      } else {
        detectCanvasIntent(userMessage, botResponse);
      }
      
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Error connecting to AI Manager.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#050508] text-white flex flex-col font-sans overflow-hidden selection:bg-white/20 relative">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none z-0"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4" type="video/mp4" />
      </video>
      {/* Top Navbar */}
      <div className="w-full px-6 pt-4 pb-2 z-50">
        <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between border border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2 hover:text-white/70 transition-colors">
            <ArrowLeft size={18} />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-white/70" />
            <span className="text-sm font-semibold tracking-wide">Interactive Canvas AI</span>
          </div>
          <div className="w-24"></div> 
        </nav>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex overflow-hidden p-6 pt-2 gap-6">
        
        {/* Left Pane: Chat Thread (35%) */}
        <div className="w-[35%] flex flex-col glass-panel rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden relative shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-white/80">
              <Bot size={16} /> Crew Manager
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${msg.sender === "user" ? "bg-white text-black" : "bg-white/10 text-white border border-white/20"}`}>
                  {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${msg.sender === "user" ? "bg-white text-black rounded-tr-sm" : "bg-white/5 border border-white/10 rounded-tl-sm text-white/90"}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="max-w-[80%] rounded-2xl p-4 bg-white/5 border border-white/10 rounded-tl-sm text-white/90">
                  <div className="flex items-center gap-1.5 h-4">
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/5 bg-[#0A0A0A]">
            <div className="relative flex items-center gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10 focus-within:border-white/30 transition-colors">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your request..." 
                className="flex-1 bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 text-sm px-3 outline-none"
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-white text-black p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Dynamic Canvas (65%) */}
        <div className="w-[65%] glass-panel rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden relative shadow-2xl flex flex-col">
          {/* Subtle Canvas Grid Background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMTAgMEwwIDBMMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjc21hbGxHcmlkKSIvPjxwYXRoIGQ9Ik00MCAwTDAgMEwwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none opacity-50" />
          
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-white/80">
              <FileText size={16} /> Interactive Canvas
            </h2>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live Sync
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
            <AnimatePresence mode="wait">
              
              {/* IDLE STATE */}
              {canvasState === "idle" && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                    <Sparkles size={32} className="text-white/80 relative z-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">Your AI Workspace</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Ask the agent to run a "Vibe Check" on a job description, or generate a "Direct Outreach" email template. The results will render dynamically right here.
                  </p>
                </motion.div>
              )}

              {/* VIBE CHECK STATE */}
              {canvasState === "vibe" && canvasData && (
                <motion.div 
                  key="vibe"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
                      <AlertTriangle className="text-white" /> Vibe Check Analysis
                    </h3>
                    <p className="text-white/50 text-sm">We translated the corporate jargon to tell you what it actually means.</p>
                  </div>

                  <div className="grid gap-4">
                    {canvasData.flags.map((flag: any, i: number) => (
                      <div key={i} className={`p-5 rounded-xl border ${flag.type === 'red' ? 'bg-red-950/20 border-red-500/20' : 'bg-green-950/20 border-green-500/20'}`}>
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 ${flag.type === 'red' ? 'text-red-400' : 'text-green-400'}`}>
                            {flag.type === 'red' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                          </div>
                          <div>
                            <h4 className="font-mono text-sm font-bold text-white/90 mb-1">"{flag.text}"</h4>
                            <p className="text-sm text-white/60">Translation: {flag.translation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-white/40">Raw AI Summary</h4>
                    <p className="text-sm text-white/70 leading-relaxed">{canvasData.text}</p>
                  </div>
                </motion.div>
              )}

              {/* OUTREACH TEMPLATE STATE */}
              {canvasState === "outreach" && canvasData && (
                <motion.div 
                  key="outreach"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 max-w-2xl mx-auto"
                >
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
                      <Mail className="text-white" /> Direct Outreach Editor
                    </h3>
                    <p className="text-white/50 text-sm">Bypass the resume black hole by sending this directly to the hiring manager on LinkedIn or Email.</p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-[#0A0A0A]">
                      <span className="text-sm font-medium text-white/40 w-16">Subject:</span>
                      <input 
                        type="text" 
                        defaultValue={canvasData.subject} 
                        className="bg-transparent border-0 text-sm font-semibold text-white/90 focus-visible:ring-0 w-full outline-none"
                      />
                    </div>
                    <div className="p-6 relative">
                      <textarea 
                        defaultValue={canvasData.body}
                        className="w-full h-64 bg-transparent border-0 text-sm text-white/80 leading-relaxed resize-none focus-visible:ring-0 outline-none custom-scrollbar"
                      />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-[#0A0A0A] flex justify-end gap-3">
                      <button 
                        onClick={() => { navigator.clipboard.writeText(`${canvasData.subject}\n\n${canvasData.body}`); alert("Copied!"); }}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Copy size={16} /> Copy to Clipboard
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* COMPANIES / JOB LISTINGS STATE */}
              {canvasState === "companies" && canvasData && canvasData.cards && (
                <motion.div 
                  key="companies"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 max-w-3xl mx-auto"
                >
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
                      <Sparkles className="text-white" /> Recommended Opportunities
                    </h3>
                    <p className="text-white/50 text-sm">AI-curated job listings and company profiles based on your query.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {canvasData.cards.map((card: any, idx: number) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-white text-lg">{card.title}</h4>
                          {card.stipend && (
                            <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-1 rounded-md">{card.stipend}</span>
                          )}
                        </div>
                        <p className="text-white/70 text-sm mb-4">{card.company}</p>
                        {card.url && (
                          <a 
                            href={card.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white hover:text-brand-green transition-colors"
                          >
                            View Listing <ArrowRight size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
