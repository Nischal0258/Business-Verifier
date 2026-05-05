"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ActivityItem {
  id: string;
  company: string;
  score: number;
  date: string;
  status: "verified" | "elevated" | "unverified";
}

const recentActivity: ActivityItem[] = [
  {
    id: "001",
    company: "Tesla Inc.",
    score: 94,
    date: "May 2, 2026",
    status: "verified",
  },
  {
    id: "002",
    company: "SpaceX Corp.",
    score: 89,
    date: "May 1, 2026",
    status: "verified",
  },
  {
    id: "003",
    company: "Neuralink LLC",
    score: 62,
    date: "Apr 30, 2026",
    status: "elevated",
  },
  {
    id: "004",
    company: "Boring Company",
    score: 78,
    date: "Apr 29, 2026",
    status: "verified",
  },
  {
    id: "005",
    company: "xAI Holdings",
    score: 31,
    date: "Apr 28, 2026",
    status: "unverified",
  },
];

const statusConfig = {
  verified: { dot: "bg-success", shadow: "shadow-[0_0_8px_var(--success)]", label: "VERIFIED" },
  elevated: { dot: "bg-warning", shadow: "shadow-[0_0_8px_var(--warning)]", label: "RISK_ELEVATED" },
  unverified: { dot: "bg-error", shadow: "shadow-[0_0_8px_var(--error)]", label: "UNVERIFIED" },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ActivityFeed() {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-16 px-4">
        <h3 className="x-section-label flex items-center gap-4">
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
          Recent_Verifications
        </h3>
        <button className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-[0.3em] hover:text-white/50 transition-colors cursor-pointer group">
          Explore_More
          <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="border border-white/[0.03] rounded-[40px] overflow-hidden"
      >
        {recentActivity.map((item, index) => {
          const config = statusConfig[item.status];
          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className={`group flex items-center justify-between px-10 md:px-16 py-8 cursor-pointer transition-all duration-500 hover:bg-white/[0.02] ${
                index < recentActivity.length - 1 ? "border-b border-white/[0.03]" : ""
              }`}
            >
              <div className="flex items-center gap-8">
                <span className="text-[9px] font-mono text-white/10 tracking-wider w-12">
                  {item.id}
                </span>
                <div className="flex items-center gap-4">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.shadow}`}
                  />
                  <span className="text-lg md:text-xl font-bold tracking-tighter group-hover:text-white transition-colors">
                    {item.company}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <span className="hidden md:block text-[9px] font-mono text-white/15 uppercase tracking-[0.3em]">
                  {config.label}
                </span>
                <span className="text-2xl font-mono tracking-tighter text-white/40 group-hover:text-white/70 transition-colors">
                  {item.score}
                </span>
                <span className="text-[9px] font-mono text-white/10 tracking-wider hidden md:block">
                  {item.date}
                </span>
                <ArrowRight
                  size={14}
                  className="text-white/0 group-hover:text-white/30 group-hover:translate-x-2 transition-all duration-500"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
