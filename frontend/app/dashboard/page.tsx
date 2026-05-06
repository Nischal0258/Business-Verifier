"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroSection from "@/components/verifyiq/HeroSection";
import MetricsRow from "@/components/dashboard/MetricsRow";
import TurnoverChart from "@/components/dashboard/TurnoverChart";
import VerificationBadge from "@/components/dashboard/VerificationBadge";
import TimelineStory from "@/components/verifyiq/TimelineStory";
import { CompanyData } from "@/types";
import { fetchCompanyData } from "@/lib/api";
import { ArrowLeft, BarChart3, FileCheck, Clock, TrendingUp, Shield, Database } from "lucide-react";

interface SearchHistoryItem {
  id: string;
  company: string;
  score: number;
  date: string;
  status: "verified" | "unverified" | "elevated";
}

const searchHistory: SearchHistoryItem[] = [
  { id: "1", company: "Apple Inc.", score: 94, date: "2 hours ago", status: "verified" },
  { id: "2", company: "Tesla Inc.", score: 89, date: "5 hours ago", status: "verified" },
  { id: "3", company: "Microsoft Corp.", score: 97, date: "1 day ago", status: "verified" },
  { id: "4", company: "Neuralink LLC", score: 62, date: "2 days ago", status: "elevated" },
];

function DashboardContent() {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCompanyData(query);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Verification protocol failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden relative">
      {/* Subtle grid background */}
      <div className="fixed inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      {/* Radial gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-transparent via-transparent to-[#050508]" />

      <AnimatePresence mode="wait">
        {!data && !loading && !error ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HeroSection onSearch={handleSearch} />
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#050508]"
          >
            <div className="relative flex h-32 w-32 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-t-blue-500/50 border-r-transparent border-b-transparent border-l-transparent"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-purple-500/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-500/60" />
              </div>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 font-mono text-xs uppercase tracking-[0.6em] text-white/40"
            >
              Scanning Global Registry...
            </motion.span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#050508] p-10 text-center"
          >
            <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <Shield className="h-10 w-10 text-red-400/60" />
            </div>
            <h2 className="mb-6 max-w-lg text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              {error}
            </h2>
            <button
              onClick={() => {
                setError(null);
                setData(null);
              }}
              className="mt-4 rounded-full border border-white/10 bg-white/5 px-10 py-4 font-medium text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white"
            >
              Return to Search
            </button>
          </motion.div>
        ) : data ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 min-h-screen"
          >
            {/* Header */}
            <header className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-40">
              <div className="mx-auto max-w-7xl px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <button
                      onClick={() => setData(null)}
                      className="group flex items-center gap-3 text-white/40 transition-colors hover:text-white"
                    >
                      <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                      <span className="font-medium">Back to Search</span>
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                      {data.company_name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                      data.is_verified
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${
                        data.is_verified ? "bg-emerald-400" : "bg-amber-400"
                      }`} />
                      <span className="text-sm font-medium">
                        {data.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                    <div className="rounded-full bg-white/5 px-4 py-2">
                      <span className="text-sm font-medium">Score: </span>
                      <span className="text-sm font-bold text-blue-400">{data.verification_score}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-6 py-12">
              {/* Metrics Row */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <MetricsRow data={data} />
              </motion.section>

              {/* Charts Section */}
              <div className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
                {/* Revenue Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 lg:col-span-2"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Revenue Analysis</h3>
                      <p className="text-sm text-white/40">Fiscal performance over time</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <TurnoverChart data={data.turnover_data} />
                  </div>
                </motion.div>

                {/* Verification Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                      <Shield className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Trust Score</h3>
                      <p className="text-sm text-white/40">Verification coefficient</p>
                    </div>
                  </div>
                  <VerificationBadge
                    is_verified={data.is_verified}
                    score={data.verification_score}
                  />
                </motion.div>
              </div>

              {/* Company History */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <FileCheck className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Company History</h3>
                    <p className="text-sm text-white/40">Institutional record and timeline</p>
                  </div>
                </div>
                <TimelineStory
                  history={data.company_history}
                  company_name={data.company_name}
                />
              </motion.section>

              {/* Search History - moved from ActivityFeed */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                    <Clock className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Search History</h3>
                    <p className="text-sm text-white/40">Recent verification queries</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {searchHistory.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
                      onClick={() => handleSearch(item.company)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                          <Database className="h-5 w-5 text-white/40" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {item.company}
                          </h4>
                          <p className="text-sm text-white/40">{item.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          item.status === "verified" ? "bg-emerald-400" :
                          item.status === "elevated" ? "bg-amber-400" : "bg-red-400"
                        }`} />
                        <span className="font-mono text-sm font-bold text-white/60">
                          {item.score}%
                        </span>
                        <ArrowLeft className="h-4 w-4 rotate-180 text-white/20 transition-transform group-hover:translate-x-1 group-hover:text-white/40" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </main>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
