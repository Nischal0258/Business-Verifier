"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Bell, Settings,
  BarChart3, FileCheck, Activity,
  X, ArrowLeft, Loader2, Shield, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyData } from "@/types";
import { fetchCompanyData, downloadCompanyPdf } from "@/lib/api";
import MetricsRow from "@/components/dashboard/MetricsRow";
import TurnoverChart from "@/components/dashboard/TurnoverChart";
import VerificationBadge from "@/components/dashboard/VerificationBadge";
import HistoryCard from "@/components/dashboard/HistoryCard";
import FeatureCards from "@/components/dashboard/FeatureCards";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import InteractiveEffects from "@/components/layout/InteractiveEffects";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Lenis from "lenis";

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const placeholderSuggestions = [
  "Ask VerifyIQ about any entity...",
  "Verify Tesla Inc....",
  "Audit SpaceX financials...",
  "Check compliance for Neuralink...",
  "Risk assessment for OpenAI...",
];

function DashboardContent() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompanyData | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  useInView(featuresRef, { once: true, margin: "-100px" });
  useInView(feedRef, { once: true, margin: "-100px" });

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Animated placeholder cycling
  useEffect(() => {
    if (data || loading || error) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderSuggestions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [data, loading, error]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchCompanyData(trimmed);
      setData(result);
    } catch (err) {
      const errorObj = err as { message?: string; retryable?: boolean };
      setError(errorObj?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (query.trim()) {
      handleSearch();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      await downloadCompanyPdf(data.company_name);
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || "Failed to download PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent-primary-muted selection:text-foreground font-sans antialiased overflow-x-hidden">
      <InteractiveEffects />

      {/* ── Fixed Navigation ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: easeOut }}
        className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 md:px-12 z-50 bg-black/50 backdrop-blur-xl border-b border-white/[0.03]"
      >
        <div className="flex items-center gap-8">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 -ml-2 hover:bg-white/[0.03] rounded-full transition-all duration-300 cursor-pointer group"
          >
            <Menu size={20} className="text-white/30 group-hover:text-white/60 transition-colors" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-[6px] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              <span className="text-black font-black text-lg italic tracking-tighter">V</span>
            </div>
            <span className="text-xl font-bold tracking-tighter font-mono uppercase">
              Verify<span className="text-white/20">IQ</span>
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-12 text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-white/20">
          <a href="#" className="hover:text-white/60 transition-colors duration-300 cursor-pointer">Protocol</a>
          <a href="#" className="hover:text-white/60 transition-colors duration-300 cursor-pointer">Security</a>
          <a href="#" className="hover:text-white/60 transition-colors duration-300 cursor-pointer">Docs</a>
          <div className="h-4 w-px bg-white/[0.06]" />
          <button className="text-white/20 hover:text-white/60 transition-colors duration-300 cursor-pointer">
            <Bell size={16} />
          </button>
          <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-white/30 text-[8px] cursor-pointer hover:bg-white/[0.03] hover:border-white/20 transition-all duration-300 font-bold">
            AD
          </div>
        </div>
      </motion.nav>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] cursor-pointer"
            />
            <motion.aside
              initial={{ x: -420 }}
              animate={{ x: 0 }}
              exit={{ x: -420 }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="fixed inset-y-0 left-0 w-[400px] bg-[#050505] border-r border-white/[0.04] z-[101] p-10 md:p-14 flex flex-col"
            >
              <div className="flex items-center justify-between mb-16">
                <span className="text-[9px] font-mono font-bold text-white/15 uppercase tracking-[0.5em]">
                  Command_Center
                </span>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <X size={16} className="text-white/15 group-hover:text-white/50 transition-colors" />
                </button>
              </div>

              <div className="space-y-14 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <section>
                  <h4 className="text-[9px] font-mono font-bold text-white/8 uppercase tracking-[0.5em] mb-6">
                    System_Modes
                  </h4>
                  <div className="space-y-2">
                    {["Truth_Engine", "Market_Sentinel", "Risk_Auditor", "Network_Logs"].map(
                      (item, i) => (
                        <button
                          key={item}
                          className={`flex items-center gap-4 w-full text-left font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                            i === 0
                              ? "bg-white/[0.04] border-white/[0.08] text-white"
                              : "border-transparent text-white/20 hover:bg-white/[0.015] hover:text-white/50"
                          } cursor-pointer group`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i === 0
                                ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                : "bg-white/8 group-hover:bg-white/20"
                            }`}
                          />
                          {item}
                        </button>
                      )
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-[9px] font-mono font-bold text-white/8 uppercase tracking-[0.5em] mb-6">
                    Verification_Streams
                  </h4>
                  <div className="space-y-1">
                    {["Strategic_Audit_v2", "Compliance_Lattice", "Regional_Data_Pipes"].map(
                      (item) => (
                        <button
                          key={item}
                          className="flex items-center gap-3 w-full text-left font-mono text-[10px] uppercase tracking-[0.2em] text-white/15 hover:text-white/40 transition-colors duration-300 cursor-pointer px-4 py-2.5 border-l border-white/[0.04] hover:border-white/15"
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>
                </section>
              </div>

              <div className="pt-8 border-t border-white/[0.04] mt-auto">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04]">
                  <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center font-mono font-bold text-white/30 text-[10px]">
                    AD
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/40">
                      Admin_Dev
                    </div>
                    <div className="text-[8px] font-mono text-white/15 uppercase tracking-wider">
                      Root_Privileges
                    </div>
                  </div>
                  <Settings
                    size={14}
                    className="text-white/15 cursor-pointer hover:text-white/40 transition-colors"
                  />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="pt-20 min-h-screen flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {/* ── Hero / Search State ── */}
          {!data && !loading && !error ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col"
            >
              {/* Hero Section */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-32 md:py-48">
                <div className="w-full max-w-4xl text-center space-y-12">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: easeOut }}
                  >
                    <h1 className="text-7xl md:text-[10rem] font-bold tracking-tighter leading-[0.85] text-white flex items-center justify-center gap-2 md:gap-6">
                      VERIFY
                      <span className="text-white/[0.06] italic">IQ</span>
                    </h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 1 }}
                      className="text-[11px] font-mono font-bold uppercase tracking-[1.2em] text-white/[0.08] mt-10"
                    >
                      Understand the Entity.
                    </motion.p>
                  </motion.div>

                  {/* Search Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: easeOut }}
                    className="relative max-w-2xl mx-auto"
                  >
                    <div className="relative bg-[#0a0a0a] border border-white/[0.06] rounded-[40px] p-2 focus-within:border-white/[0.15] focus-within:shadow-[0_0_60px_rgba(255,255,255,0.03)] transition-all duration-700 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden">
                      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholderSuggestions[placeholderIndex]}
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/[0.12] py-5 px-8 resize-none text-lg md:text-xl leading-relaxed min-h-[72px] max-h-[400px] overflow-y-auto custom-scrollbar transition-all duration-300"
                      />
                      <div className="absolute bottom-3.5 right-5 flex items-center gap-3">
                        <button
                          onClick={() => handleSearch()}
                          className={`p-3 rounded-full transition-all duration-500 ${
                            query
                              ? "bg-white text-black scale-110 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
                              : "bg-white/[0.04] text-white/15 scale-100 cursor-not-allowed"
                          }`}
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="mt-8 flex flex-wrap justify-center gap-3"
                    >
                      {["Audit Tesla", "Verify SpaceX", "Compliance Check"].map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setQuery(tag);
                              handleSearch();
                            }}
                            className="px-5 py-2.5 rounded-full border border-white/[0.06] text-[9px] font-mono uppercase tracking-[0.2em] text-white/20 hover:bg-white/[0.03] hover:border-white/[0.15] hover:text-white/40 transition-all duration-300 cursor-pointer"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Feature Cards Section */}
              <div ref={featuresRef} className="w-full max-w-7xl mx-auto px-6 md:px-10 pb-32">
                <FeatureCards />
              </div>

              {/* Activity Feed Section */}
              <div ref={feedRef} className="w-full max-w-7xl mx-auto px-6 md:px-10 pb-40">
                <ActivityFeed />
              </div>

              {/* CTA Banner */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="w-full max-w-7xl mx-auto px-6 md:px-10 pb-40"
              >
                <div className="relative rounded-[40px] border border-white/[0.04] bg-white/[0.01] p-16 md:p-24 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: easeOut }}
                    className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 relative z-10"
                  >
                    Do more with{" "}
                    <span className="x-gradient-text">VerifyIQ</span>.
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-[13px] text-white/25 max-w-md mx-auto mb-10 relative z-10"
                  >
                    Unlock SuperGrok-level verification. Deep audits, real-time
                    monitoring, and predictive risk analysis.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="px-10 py-4 rounded-full bg-white text-black font-mono font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-white/80 transition-all duration-300 cursor-pointer relative z-10"
                  >
                    Sign_Up_Now
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            /* ── Loading State ── */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-40"
            >
              <div className="relative w-28 h-28">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t border-r border-white/15 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-5 border-b border-l border-white/[0.06] rounded-full"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-10 border-t border-white/[0.03] rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[7px] font-mono font-bold text-white/30 animate-pulse tracking-[0.3em]">
                    SCAN
                  </span>
                </div>
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-14 text-[9px] font-mono uppercase tracking-[0.8em] text-white/15"
              >
                Ingesting_Real_Time_Truth
              </motion.span>
            </motion.div>
          ) : error ? (
            /* ── Error State ── */
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-10 text-center py-40"
            >
              <span className="text-rose-400/60 font-mono text-[9px] uppercase tracking-[0.5em] mb-8">
                {error.includes("Unable to connect") || error.includes("Network") ? "Connection_Error" : error.includes("timeout") ? "Timeout_Error" : "Access_Denied"}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 max-w-lg tracking-tighter leading-none">
                {error}
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setError(null);
                    setQuery("");
                  }}
                  className="px-10 py-4 rounded-full border border-white/[0.06] text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500 cursor-pointer"
                >
                  Reset_Session
                </button>
                <button
                  onClick={handleRetry}
                  className="px-10 py-4 rounded-full border border-white/[0.06] text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          ) : data ? (
            /* ── Results State ── */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: easeOut }}
              className="w-full max-w-7xl mx-auto p-6 md:p-10 pb-40"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
                <div className="space-y-6">
                  <button
                    onClick={() => setData(null)}
                    className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/15 hover:text-white/40 transition-colors duration-300 cursor-pointer group"
                  >
                    <ArrowLeft
                      size={12}
                      className="group-hover:-translate-x-1 transition-transform duration-300"
                    />
                    Back_to_Search
                  </button>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: easeOut }}
                    className="text-6xl md:text-[8rem] font-bold tracking-tighter uppercase leading-[0.8]"
                  >
                    {data.company_name}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center gap-6 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]"
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                      VERIFIED_ENTITY
                    </span>
                    <span>SCORE: {data.verification_score}/100</span>
                    <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full">
                      TIMESTAMP: {new Date().toISOString().split("T")[0]}
                    </span>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="px-12 py-6 rounded-full bg-white text-black hover:bg-white/80 transition-all duration-300 font-mono font-bold text-[10px] tracking-[0.2em] h-auto"
                  >
                    {pdfLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "GENERATE_REPORT.pdf"
                    )}
                  </Button>
                </motion.div>
              </header>

              <div className="space-y-32">
                {/* Metrics */}
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="bg-white/[0.01] border border-white/[0.03] rounded-[40px] p-8 md:p-12"
                >
                  <div className="flex items-center gap-4 mb-12 px-4">
                    <Activity size={14} className="text-white/15" />
                    <h3 className="x-section-label">Real_Time_Vitals</h3>
                  </div>
                  <MetricsRow data={data} />
                </motion.section>

                {/* Chart + Badge */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: easeOut }}
                    className="bg-[#0a0a0a] border border-white/[0.03] rounded-[40px] p-10 md:p-14"
                  >
                    <h3 className="x-section-label mb-14 flex items-center gap-4">
                      <BarChart3 size={14} /> Revenue_Vector_Analysis
                    </h3>
                    <TurnoverChart data={data.turnover_data} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.8, ease: easeOut }}
                    className="bg-[#0a0a0a] border border-white/[0.03] rounded-[40px] p-10 md:p-14 flex flex-col items-center justify-center"
                  >
                    <h3 className="x-section-label mb-14 w-full text-left flex items-center gap-4">
                      <Shield size={14} /> Trust_Coefficient
                    </h3>
                    <VerificationBadge
                      is_verified={data.is_verified}
                      score={data.verification_score}
                    />
                  </motion.div>
                </div>

                {/* History */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: easeOut }}
                  className="bg-white/[0.01] border border-white/[0.03] rounded-[40px] p-10 md:p-14"
                >
                  <div className="flex items-center gap-4 mb-14">
                    <FileCheck size={14} className="text-white/15" />
                    <h3 className="x-section-label">Historical_Audit_Log</h3>
                  </div>
                  <HistoryCard
                    history={data.company_history}
                    company_name={data.company_name}
                  />
                </motion.section>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* ── Technical Footer ── */}
      <footer className="fixed bottom-0 left-0 right-0 h-14 bg-black/60 backdrop-blur-xl flex items-center justify-between px-8 md:px-12 text-[8px] font-mono uppercase tracking-[0.5em] text-white/[0.08] border-t border-white/[0.02] z-40">
        <div className="flex gap-10">
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/15 rounded-full" />
            NODE_ONLINE: {Math.random().toString(36).substr(2, 5).toUpperCase()}
          </span>
          <span>LATENCY: 4MS</span>
        </div>
        <div className="flex gap-10">
          <span>&copy; 2026 VerifyIQ</span>
          <span className="text-white/15">ALL_SYSTEMS_OPERATIONAL</span>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute fallbackPath="/">
      <DashboardContent />
    </ProtectedRoute>
  );
}
