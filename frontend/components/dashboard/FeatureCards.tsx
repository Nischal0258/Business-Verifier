"use client";

import { motion } from "framer-motion";
import { Brain, Radar, ShieldCheck, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Truth Engine",
    description:
      "Deep entity analysis with real-time data ingestion. Cross-reference thousands of sources to surface the ground truth about any business.",
    tag: "Core_Protocol",
  },
  {
    icon: Radar,
    title: "Market Sentinel",
    description:
      "Continuous monitoring of financial signals, regulatory filings, and market movements. Get alerted before risks materialize.",
    tag: "Stream_v2",
  },
  {
    icon: ShieldCheck,
    title: "Risk Auditor",
    description:
      "Automated compliance checks against global regulatory frameworks. Score entities against 200+ risk indicators in seconds.",
    tag: "Audit_Lattice",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function FeatureCards() {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-16 px-4">
        <h3 className="x-section-label flex items-center gap-4">
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
          Core_Capabilities
        </h3>
        <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">
          3 Active Modules
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.03] rounded-[40px] overflow-hidden border border-white/[0.03]"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group relative bg-[#000] p-12 md:p-16 flex flex-col justify-between min-h-[420px] cursor-pointer transition-all duration-700 hover:bg-white/[0.02]"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:border-white/[0.15] group-hover:bg-white/[0.06] transition-all duration-500">
                    <Icon
                      size={20}
                      className="text-white/30 group-hover:text-white/70 transition-colors duration-500"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-white/10 uppercase tracking-[0.3em] group-hover:text-white/20 transition-colors duration-500">
                    {feature.tag}
                  </span>
                </div>

                <div>
                  <h4 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 group-hover:text-white transition-colors duration-500">
                    {feature.title}
                  </h4>
                  <p className="text-[13px] leading-[1.7] text-white/30 group-hover:text-white/50 transition-colors duration-500 max-w-sm">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-3 mt-12">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/10 group-hover:text-white/40 transition-colors duration-500">
                  Explore
                </span>
                <ArrowRight
                  size={14}
                  className="text-white/10 group-hover:text-white/40 group-hover:translate-x-2 transition-all duration-500"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
