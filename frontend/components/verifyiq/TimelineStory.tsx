"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface TimelineStoryProps {
  companyName: string;
  history: string;
}

function AIGeneratedCard({
  companyName,
  history,
}: {
  companyName: string;
  history: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e6dfd8]/10 bg-gradient-to-br from-[#efe9de]/[0.03] to-transparent p-8">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-[#cc785c]/10 to-transparent blur-[40px]" />

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#cc785c]/10">
            <Sparkles className="h-5 w-5 text-[#cc785c]" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]/70">
              Overview
            </span>
          </div>
        </div>

        <div className="mb-5">
          <h4 className="mb-2 font-['Tiempos_Headline', serif] text-xl font-normal tracking-[-0.01em] text-[#faf9f5] leading-[1.5]">
            {companyName}
          </h4>
          <div className="h-px w-12 bg-gradient-to-r from-[#cc785c] to-transparent" />
        </div>

        <div className="flex-1">
          <p className="font-['StyreneB',_Inter,sans-serif] text-[14px] leading-[1.7] text-[#a09d96]">
            {history || "Detailed overview is being compiled from verified sources across the web."}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-6 border-t border-[#e6dfd8]/5 pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#5db872]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#a09d96]">
              Verified Sources
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#5db8a6] to-[#4a9a87]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#a09d96]">
              AI Powered
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TimelineStory({ companyName, history }: TimelineStoryProps) {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="relative py-20 md:py-28">
      <motion.div style={{ y, opacity }} className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#cc785c]/[0.06] via-[#5db8a6]/[0.04] to-[#e8a55a]/[0.04] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl px-5">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-14 text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-[#e6dfd8]/10 bg-[#efe9de]/[0.02] px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-[#a09d96]">
                Company Overview
              </span>
            </div>

            <h2 className="mb-4 font-['Tiempos_Headline', serif] text-3xl font-normal tracking-[-1px] md:text-5xl leading-[1.2] text-[#faf9f5]">
              {companyName}
            </h2>
          </motion.div>

          <div className="mt-8">
            <AIGeneratedCard companyName={companyName} history={history} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
