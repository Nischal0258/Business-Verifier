"use client";

import { motion } from "framer-motion";

interface HistoryCardProps {
  history: string;
  company_name: string;
}

export default function HistoryCard({ history, company_name }: HistoryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="p-10 md:p-14 bg-white/[0.005] border border-white/[0.03] rounded-[32px]"
    >
      <div className="flex flex-col md:flex-row gap-12">
        <div className="md:w-1/4">
          <h4 className="text-[9px] font-mono font-bold text-white/15 uppercase tracking-[0.4em] mb-4">
            Institutional_Record
          </h4>
          <div className="h-px w-full bg-white/[0.06]" />
        </div>
        <div className="md:w-3/4">
          <p
            className="text-xl md:text-2xl text-white/60 font-serif leading-[1.7] italic"
            style={{ maxWidth: "50ch" }}
          >
            &ldquo;{history}&rdquo;
          </p>
          <div className="mt-8 flex items-center gap-4 text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
            <span>Verified Source: Official_Gazette</span>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span>Entity: {company_name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
