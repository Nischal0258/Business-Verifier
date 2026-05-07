"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroSection from "@/components/verifyiq/HeroSection";
import TurnoverChart from "@/components/dashboard/TurnoverChart";
import CompanyInformationChapter from "@/components/dashboard/CompanyInformationChapter";
import { CompanyData } from "@/types";
import { fetchCompanyData, downloadCompanyPdf } from "@/lib/api";
import {
  ArrowLeft,
  BookOpenText,
  Building2,
  Clock,
  Download,
  FileBarChart,
  Lightbulb,
  LineChart,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

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

function toCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function historyParagraphs(history: string): string[] {
  if (!history) return [];
  const cleaned = history.trim();
  if (!cleaned) return [];

  const chunks = cleaned
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (chunks.length >= 2) return chunks;

  const sentences = cleaned
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 4) return [cleaned];
  const midpoint = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, midpoint).join(" "), sentences.slice(midpoint).join(" ")];
}

function getRevenueDelta(data: { year: string; revenue: number }[]): number | null {
  if (!data || data.length < 2) return null;
  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const first = sorted[0]?.revenue ?? 0;
  const last = sorted[sorted.length - 1]?.revenue ?? 0;
  if (!first) return null;
  return ((last - first) / first) * 100;
}

function strategicInsights(data: CompanyData): string[] {
  const delta = getRevenueDelta(data.turnover_data);
  const insights: string[] = [];

  if (data.is_verified) {
    insights.push("Verification confidence is strong, indicating a consistent public business footprint.");
  } else {
    insights.push("Verification confidence is moderate; additional due diligence is recommended before commitment.");
  }

  if (delta !== null) {
    insights.push(
      delta >= 0
        ? `Revenue trajectory is positive over the observed window, with an estimated growth of ${delta.toFixed(1)}%.`
        : `Revenue trajectory is under pressure, with an estimated decline of ${Math.abs(delta).toFixed(1)}%.`,
    );
  } else {
    insights.push("Revenue trend cannot be established due to limited disclosed turnover data.");
  }

  insights.push(
    "Strategically, leadership should prioritize transparency cadence, investor communication, and geographic risk balancing.",
  );

  return insights;
}

function DashboardContent() {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const handleDownloadPdf = async () => {
    if (!data || pdfLoading) return;
    setPdfLoading(true);
    try {
      await downloadCompanyPdf(data.company_name);
    } catch (err: any) {
      setError(err?.message || "PDF download failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];
  const chapters = [
    { id: "chapter-history", label: "Chapter I", title: "Company History" },
    { id: "chapter-company-info", label: "Chapter II", title: "Company Information" },
    { id: "chapter-analysis", label: "Chapter III", title: "Business Analysis" },
    { id: "chapter-financials", label: "Chapter IV", title: "Financial Performance" },
    { id: "chapter-strategy", label: "Chapter V", title: "Strategic Insights" },
  ];

  return (
    <div className="min-h-screen bg-[#111014] text-[#f4f0e8] font-sans overflow-x-hidden relative scroll-smooth">
      {/* Subtle grid background */}
      <div className="fixed inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      {/* Radial gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-transparent via-transparent to-[#111014]" />

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
            className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#111014]"
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
            className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#111014] p-10 text-center"
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
            <header className="border-b border-[#d8c7a8]/10 bg-[#111014]/85 backdrop-blur-xl sticky top-0 z-40">
              <div className="mx-auto max-w-7xl px-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setData(null)}
                      className="group flex items-center gap-3 text-[#c7b89c] transition-colors hover:text-[#f4f0e8]"
                    >
                      <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                      <span className="font-medium">Back to Search</span>
                    </button>
                    <div className="hidden h-8 w-px bg-[#d8c7a8]/20 md:block" />
                    <h1 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
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
                    <div className="rounded-full bg-[#d8c7a8]/10 px-4 py-2">
                      <span className="text-sm font-medium">Score: </span>
                      <span className="text-sm font-bold text-blue-400">{data.verification_score}/100</span>
                    </div>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading}
                      className="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-blue-400 transition-all duration-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pdfLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
                        />
                      ) : (
                        <Download size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {pdfLoading ? "Generating..." : "Download PDF"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10 md:py-14">
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-[260px_1fr]">
                <aside className="xl:sticky xl:top-28 h-fit rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-5">
                  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#bfae8f]">Contents</p>
                  <nav className="space-y-2">
                    {chapters.map((chapter) => (
                      <a
                        key={chapter.id}
                        href={`#${chapter.id}`}
                        className="block rounded-lg px-3 py-2 text-sm text-[#d9cfbe] transition hover:bg-[#d8c7a8]/10 hover:text-white"
                      >
                        <span className="mr-2 text-xs text-[#bfae8f]">{chapter.label}</span>
                        {chapter.title}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 space-y-3 border-t border-[#d8c7a8]/10 pt-5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#bfae8f]">Verification</span>
                      <span className={data.is_verified ? "text-emerald-400" : "text-amber-400"}>
                        {data.is_verified ? "Verified" : "Review Needed"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#bfae8f]">Score</span>
                      <span className="font-semibold">{data.verification_score}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#bfae8f]">Revenue Points</span>
                      <span className="font-semibold">{data.turnover_data.length}</span>
                    </div>
                  </div>
                </aside>

                <div className="space-y-8">
                  <motion.section
                    id="chapter-history"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.55 }}
                    className="rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-6 md:p-8"
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#d8c7a8]/10 p-2">
                          <BookOpenText className="h-5 w-5 text-[#e4d6bd]" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Chapter I</p>
                          <h2 className="font-serif text-2xl md:text-3xl">Company History</h2>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 text-[15px] leading-8 text-[#e5dccf]">
                      {historyParagraphs(data.company_history).map((paragraph, idx) => (
                        <p key={`${paragraph.slice(0, 20)}-${idx}`}>{paragraph}</p>
                      ))}
                    </div>
                  </motion.section>

                  <motion.section
                    id="chapter-company-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.55 }}
                  >
                    <CompanyInformationChapter
                      companyName={data.company_name}
                      founders={data.founder_profiles}
                      headquarters={data.headquarters_info}
                      operations={data.global_operations}
                      citations={data.citation_sources}
                      chapterLastUpdated={data.chapter_last_updated}
                    />
                  </motion.section>

                  <motion.section
                    id="chapter-analysis"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.55 }}
                    className="rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-6 md:p-8"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-xl bg-[#d8c7a8]/10 p-2">
                        <Building2 className="h-5 w-5 text-[#e4d6bd]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Chapter III</p>
                        <h2 className="font-serif text-2xl md:text-3xl">Business Analysis</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Trust Index</p>
                        <p className="mt-2 text-3xl font-semibold text-white">{data.verification_score}</p>
                        <p className="mt-2 text-sm text-[#d9cfbe]">
                          {data.is_verified
                            ? "Strong confidence based on public and financial signals."
                            : "Moderate confidence. Consider deeper diligence before decisions."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Revenue Trend</p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {getRevenueDelta(data.turnover_data) !== null
                            ? `${getRevenueDelta(data.turnover_data)!.toFixed(1)}%`
                            : "N/A"}
                        </p>
                        <p className="mt-2 text-sm text-[#d9cfbe]">
                          Change across available fiscal records.
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Coverage</p>
                        <p className="mt-2 text-3xl font-semibold text-white">{data.turnover_data.length}</p>
                        <p className="mt-2 text-sm text-[#d9cfbe]">
                          Historical revenue observations in this profile.
                        </p>
                      </div>
                    </div>
                  </motion.section>

                  <motion.section
                    id="chapter-financials"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.55 }}
                    className="rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-6 md:p-8"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-xl bg-[#d8c7a8]/10 p-2">
                        <FileBarChart className="h-5 w-5 text-[#e4d6bd]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Chapter IV</p>
                        <h2 className="font-serif text-2xl md:text-3xl">Financial Performance</h2>
                      </div>
                    </div>

                    <div className="mb-6 rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-[#bfae8f]" />
                        <p className="text-sm text-[#d9cfbe]">Revenue Visualization</p>
                      </div>
                      <div className="h-[320px]">
                        <TurnoverChart data={data.turnover_data} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[...data.turnover_data]
                        .sort((a, b) => Number(b.year) - Number(a.year))
                        .slice(0, 4)
                        .map((item) => (
                          <div key={item.year} className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm text-[#bfae8f]">Fiscal {item.year}</p>
                              <TrendingUp className="h-4 w-4 text-[#e4d6bd]" />
                            </div>
                            <p className="text-xl font-semibold text-white">{toCompactCurrency(item.revenue)}</p>
                          </div>
                        ))}
                    </div>
                  </motion.section>

                  <motion.section
                    id="chapter-strategy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.55 }}
                    className="rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-6 md:p-8"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-xl bg-[#d8c7a8]/10 p-2">
                        <Lightbulb className="h-5 w-5 text-[#e4d6bd]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Chapter V</p>
                        <h2 className="font-serif text-2xl md:text-3xl">Strategic Insights</h2>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {strategicInsights(data).map((insight, index) => (
                        <div key={index} className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#e4d6bd]" />
                            <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Insight {index + 1}</p>
                          </div>
                          <p className="text-[15px] leading-7 text-[#e5dccf]">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.55 }}
                    className="rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-6 md:p-8"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#bfae8f]" />
                      <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Recent Searches</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {searchHistory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSearch(item.company)}
                          className="flex items-center justify-between rounded-xl border border-[#d8c7a8]/10 bg-[#111018] px-4 py-3 text-left transition hover:bg-[#1a1820]"
                        >
                          <span className="text-sm text-[#e5dccf]">{item.company}</span>
                          <span className="text-xs text-[#bfae8f]">{item.score}%</span>
                        </button>
                      ))}
                    </div>
                  </motion.section>
                </div>
              </div>
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
