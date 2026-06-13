"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Clock,
  ExternalLink,
  Building2,
  TrendingUp,
  Users,
  Filter,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  X,
  ChevronLeft,
  Shield,
  Heart,
  Zap,
} from "lucide-react";
import { fetchStudentCompanyReport } from "@/lib/api";
import type {
  CompanyStudentReport,
  OpportunityItem,
  StudentTrustScore,
} from "@/types/student";

/* ═══════════════════ TRUST SCORE BADGE ═══════════════════ */
function TrustBadge({ score, tier }: { score: number; tier: string }) {
  const color =
    score >= 80
      ? "#2D8B5F"
      : score >= 60
      ? "#D4AF37"
      : score >= 40
      ? "#C9870A"
      : "#C93B3B";
  const label =
    tier === "established"
      ? "Established"
      : tier === "rising_star"
      ? "Rising Star"
      : tier === "emerging"
      ? "Emerging"
      : "New";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <Shield size={12} />
      {score}/100 • {label}
    </div>
  );
}

/* ═══════════════════ SKILL TAG ═══════════════════ */
function SkillChip({ skill }: { skill: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
      style={{
        background: "var(--accent-primary-subtle)",
        color: "var(--accent-primary-light)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {skill}
    </span>
  );
}

/* ═══════════════════ OPPORTUNITY CARD ═══════════════════ */
function OpportunityCard({
  opp,
  isSelected,
  onClick,
}: {
  opp: OpportunityItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className="relative cursor-pointer rounded-xl p-4 transition-all duration-200"
      style={{
        background: isSelected
          ? "var(--selected-overlay)"
          : "var(--bg-card)",
        borderLeft: isSelected
          ? "3px solid var(--accent-primary)"
          : "3px solid transparent",
        border: isSelected
          ? undefined
          : "1px solid var(--border-subtle)",
      }}
      whileHover={{
        backgroundColor: "var(--bg-card-hover)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Type Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            background:
              opp.type === "internship"
                ? "rgba(45,139,95,0.15)"
                : "rgba(59,107,140,0.15)",
            color:
              opp.type === "internship" ? "#2D8B5F" : "#4A8AAD",
          }}
        >
          {opp.type === "internship" ? "Internship" : opp.type === "full_time" ? "Full-Time" : opp.type}
        </span>
        {opp.posted_date && (
          <span
            className="text-[10px] flex items-center gap-1"
            style={{ color: "var(--text-muted)" }}
          >
            <Clock size={10} /> {opp.posted_date}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-sm font-bold mb-1 line-clamp-2"
        style={{ color: "var(--text-primary)" }}
      >
        {opp.title}
      </h3>

      {/* Company + Location */}
      <div className="flex items-center gap-3 mb-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1">
          <Building2 size={11} /> {opp.company_name}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={11} /> {opp.location}
        </span>
      </div>

      {/* Stipend */}
      {opp.stipend && (
        <div
          className="text-xs font-semibold mb-2"
          style={{ color: "var(--accent-primary)" }}
        >
          ₹ {opp.stipend}
        </div>
      )}

      {/* Skills */}
      {opp.skills_required.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {opp.skills_required.slice(0, 4).map((s) => (
            <SkillChip key={s} skill={s} />
          ))}
          {opp.skills_required.length > 4 && (
            <span className="text-[10px] self-center" style={{ color: "var(--text-muted)" }}>
              +{opp.skills_required.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Source */}
      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
          via {opp.source || "Web Search"}
        </span>
        {opp.is_active && (
          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#2D8B5F" }}>
            <Zap size={10} /> Actively Hiring
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════ DETAIL PANEL ═══════════════════ */
function DetailPanel({
  report,
  selectedOpp,
}: {
  report: CompanyStudentReport;
  selectedOpp: OpportunityItem | null;
}) {
  if (!selectedOpp) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
        <div className="text-center">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Select an opportunity to view details</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={selectedOpp.title}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 overflow-y-auto h-full"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background:
                selectedOpp.type === "internship" ? "rgba(45,139,95,0.15)" : "rgba(59,107,140,0.15)",
              color: selectedOpp.type === "internship" ? "#2D8B5F" : "#4A8AAD",
            }}
          >
            {selectedOpp.type === "internship" ? "Internship" : selectedOpp.type}
          </span>
          {selectedOpp.is_active && (
            <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(45,139,95,0.1)", color: "#2D8B5F" }}>
              <Zap size={10} /> Actively Hiring
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {selectedOpp.title}
        </h2>
        <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1"><Building2 size={14} /> {selectedOpp.company_name}</span>
          <span className="flex items-center gap-1"><MapPin size={14} /> {selectedOpp.location}</span>
        </div>
      </div>

      {/* Key Details */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {selectedOpp.stipend && (
          <div className="rounded-lg p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Stipend</div>
            <div className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>₹ {selectedOpp.stipend}</div>
          </div>
        )}
        {selectedOpp.duration && (
          <div className="rounded-lg p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Duration</div>
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{selectedOpp.duration}</div>
          </div>
        )}
      </div>

      {/* Skills */}
      {selectedOpp.skills_required.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Skills Required</h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedOpp.skills_required.map((s) => (
              <SkillChip key={s} skill={s} />
            ))}
          </div>
        </div>
      )}

      {/* Company Trust Score */}
      <div className="rounded-lg p-4 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Company Trust Score
        </h4>
        <div className="flex items-center gap-3 mb-2">
          <TrustBadge score={report.student_trust_score.total_score} tier={report.student_trust_score.company_tier} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
          {report.student_trust_score.verdict || `This company scores ${report.student_trust_score.total_score}/100 on our student trust index.`}
        </p>
      </div>

      {/* Reviews */}
      {report.reviews.review_count > 0 && (
        <div className="rounded-lg p-4 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Employee Reviews</h4>
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} fill="#D4AF37" stroke="#D4AF37" />
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {report.reviews.overall_rating?.toFixed(1) || "N/A"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ({report.reviews.review_count} reviews)
            </span>
          </div>
          {report.reviews.top_pros.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase" style={{ color: "#2D8B5F" }}>Pros:</span>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {report.reviews.top_pros.slice(0, 3).join(" • ")}
              </p>
            </div>
          )}
          {report.reviews.top_cons.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase" style={{ color: "#C93B3B" }}>Cons:</span>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {report.reviews.top_cons.slice(0, 3).join(" • ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Social Media */}
      <div className="flex flex-wrap gap-2 mb-6">
        {report.social_media.linkedin_url && (
          <a href={report.social_media.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "rgba(10,102,194,0.1)", color: "#0A66C2", border: "1px solid rgba(10,102,194,0.2)" }}>
            <Linkedin size={12} /> LinkedIn
          </a>
        )}
        {report.social_media.instagram_url && (
          <a href={report.social_media.instagram_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "rgba(225,48,108,0.1)", color: "#E1306C", border: "1px solid rgba(225,48,108,0.2)" }}>
            <Instagram size={12} /> Instagram
          </a>
        )}
        {report.social_media.twitter_url && (
          <a href={report.social_media.twitter_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "rgba(29,161,242,0.1)", color: "#1DA1F2", border: "1px solid rgba(29,161,242,0.2)" }}>
            <Twitter size={12} /> Twitter / X
          </a>
        )}
      </div>

      {/* Apply CTA */}
      <a
        href={selectedOpp.apply_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, var(--accent-primary), var(--accent-primary-light))",
          color: "#000",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        Apply Now <ExternalLink size={14} />
      </a>
    </motion.div>
  );
}

/* ═══════════════════ MAIN EXPLORE PAGE ═══════════════════ */
export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompanyStudentReport | null>(null);
  const [selectedOppIdx, setSelectedOppIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setSelectedOppIdx(0);

    try {
      const data = await fetchStudentCompanyReport(q);
      setReport(data);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to search. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const selectedOpp = report?.opportunities?.[selectedOppIdx] ?? null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* ───────── TOP NAV BAR ───────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            InternIQ
          </span>
        </Link>

        {/* Search Bar — Indeed-style dual input */}
        <div className="flex items-center gap-0 flex-1 max-w-2xl mx-6">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Company name, e.g. Razorpay, Zepto, Local Startup..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-l-xl border-0 outline-none"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderRight: "1px solid var(--border-subtle)",
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="px-5 py-2.5 text-sm font-bold rounded-r-xl transition-all duration-200 disabled:opacity-40"
            style={{
              background: "var(--accent-primary)",
              color: "#000",
            }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles size={16} />
              </motion.div>
            ) : (
              "Search"
            )}
          </button>
        </div>

        <nav className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </nav>
      </header>

      {/* ───────── MAIN CONTENT ───────── */}
      <main className="flex-1 flex flex-col">
        {/* HERO STATE — no search yet */}
        {!report && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="text-center max-w-xl">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(212,175,55,0.1)",
                    "0 0 60px rgba(212,175,55,0.2)",
                    "0 0 30px rgba(212,175,55,0.1)",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center"
                style={{
                  background: "var(--accent-primary-muted)",
                  border: "1px solid var(--accent-primary)",
                }}
              >
                <Sparkles size={32} style={{ color: "var(--accent-primary)" }} />
              </motion.div>
              <h1
                className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Discover Opportunities{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--accent-primary), var(--accent-primary-light))",
                  }}
                >
                  Beyond MNCs
                </span>
              </h1>
              <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
                Search any company — from Google to your local startup. Our AI agents find
                internships, reviews, social media, and calculate a Student Trust Score so you
                know exactly what you&apos;re getting into.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Razorpay", "Zepto", "PhonePe", "CRED", "Local Startup"].map((company) => (
                  <button
                    key={company}
                    onClick={() => {
                      setSearchQuery(company);
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: "var(--accent-primary-muted)",
                  border: "2px solid var(--accent-primary)",
                }}
              >
                <Sparkles size={24} style={{ color: "var(--accent-primary)" }} />
              </motion.div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                AI Agents are Researching...
              </h3>
              <div className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {[
                  "🔍 Company Scout is verifying the company...",
                  "💼 Opportunity Hunter is finding internships...",
                  "📱 Social Media Detective is scanning profiles...",
                  "⭐ Review Analyst is reading Glassdoor reviews...",
                  "🛡️ Trust Evaluator is calculating your score...",
                ].map((step, i) => (
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.6 }}
                  >
                    {step}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div
              className="text-center p-8 rounded-2xl max-w-md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--error-muted)",
              }}
            >
              <div className="text-4xl mb-4">😔</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--error-light)" }}>
                Something went wrong
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                {error}
              </p>
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "var(--accent-primary-muted)",
                  color: "var(--accent-primary)",
                  border: "1px solid var(--accent-primary)",
                }}
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* ───────── RESULTS — INDEED-STYLE SPLIT VIEW ───────── */}
        {report && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Result Summary Bar */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {report.company_name}
                </h2>
                <TrustBadge
                  score={report.student_trust_score.total_score}
                  tier={report.student_trust_score.company_tier}
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {report.total_opportunities || report.opportunities.length} opportunities found
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/company/${encodeURIComponent(report.company_name)}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--accent-primary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  View Full Profile →
                </Link>
              </div>
            </div>

            {/* Split View: Left = Cards, Right = Detail */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel — Job Cards */}
              <div
                className="w-full md:w-[420px] lg:w-[460px] overflow-y-auto flex-shrink-0 space-y-2 p-4"
                style={{ borderRight: "1px solid var(--border-subtle)" }}
              >
                {report.opportunities.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      No specific listings found yet.
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                      Check the company profile for careers page links.
                    </p>
                  </div>
                ) : (
                  report.opportunities.map((opp, idx) => (
                    <OpportunityCard
                      key={`${opp.title}-${idx}`}
                      opp={opp}
                      isSelected={idx === selectedOppIdx}
                      onClick={() => setSelectedOppIdx(idx)}
                    />
                  ))
                )}
              </div>

              {/* Right Panel — Detail Preview (hidden on mobile) */}
              <div className="hidden md:block flex-1 overflow-y-auto" style={{ background: "var(--surface)" }}>
                <AnimatePresence mode="wait">
                  <DetailPanel report={report} selectedOpp={selectedOpp} />
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
