"use client";

import { CompanyData } from "@/types";
import { motion } from "framer-motion";

interface MetricsRowProps {
  data: CompanyData;
}

export default function MetricsRow({ data }: MetricsRowProps) {
  const riskLevel =
    data.verification_score >= 80
      ? "Low"
      : data.verification_score >= 50
        ? "Medium"
        : "High";

  const riskDot =
    data.verification_score >= 80
      ? "bg-emerald-500"
      : data.verification_score >= 50
        ? "bg-amber-500"
        : "bg-rose-500";

  const statusText = data.is_verified ? "Verified" : "Unverified";
  const statusDot = data.is_verified ? "bg-emerald-500" : "bg-rose-500";

  const metrics = [
    {
      label: "Audit Score",
      value: data.verification_score.toString() + "%",
      showDot: false,
    },
    {
      label: "Risk Index",
      value: riskLevel,
      showDot: true,
      dotClass: riskDot,
    },
    {
      label: "Data Points",
      value: (data.turnover_data.length * 12).toString(),
      showDot: false,
    },
    {
      label: "Entity Status",
      value: statusText,
      showDot: true,
      dotClass: statusDot,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.03]">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#000] p-8 md:p-10 group"
        >
          <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/15 mb-6 group-hover:text-white/30 transition-colors duration-300">
            {metric.label}
          </p>
          <div className="flex items-center gap-3">
            {metric.showDot && (
              <span className={`w-1 h-1 rounded-full ${metric.dotClass}`} />
            )}
            <span className="text-3xl md:text-4xl font-mono tracking-tighter text-white/80 group-hover:text-white transition-colors duration-300">
              {metric.value}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
