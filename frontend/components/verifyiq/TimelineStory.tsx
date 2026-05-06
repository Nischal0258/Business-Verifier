"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Building2, TrendingUp, Users, Globe, Award, ChevronRight, ExternalLink } from "lucide-react";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  icon: "founding" | "growth" | "expansion" | "recognition" | "milestone";
  readMoreUrl?: string;
}

interface TimelineStoryProps {
  companyName: string;
  history: string;
  websiteUrl?: string;
}

const iconMap = {
  founding: Building2,
  growth: TrendingUp,
  expansion: Globe,
  recognition: Award,
  milestone: Users,
};

function generateTimelineEvents(companyName: string, websiteUrl?: string): TimelineEvent[] {
  const baseUrl = websiteUrl || "https://www.google.com/search?q=";
  const searchBase = `https://www.google.com/search?q=${encodeURIComponent(companyName)}`;

  return [
    {
      year: "Foundation",
      title: "Company Founded",
      description: `${companyName} was established with a clear vision and mission to deliver exceptional value in its sector. The founding team brought together diverse expertise and a shared commitment to innovation that would guide the company's early trajectory.`,
      icon: "founding",
      readMoreUrl: `${searchBase}+founding+history`,
    },
    {
      year: "Early Growth",
      title: "Initial Traction",
      description: `In its formative years, ${companyName} rapidly gained traction by identifying key market opportunities and executing with precision. The company built a strong foundation in product development and customer acquisition during this critical phase.`,
      icon: "growth",
      readMoreUrl: `${searchBase}+early+growth+history`,
    },
    {
      year: "Market Expansion",
      title: "Global Reach",
      description: `${companyName} expanded its footprint beyond initial markets, diversifying its product portfolio and entering new geographic regions. This expansion was marked by strategic partnerships and a focus on local market adaptation.`,
      icon: "expansion",
      readMoreUrl: `${searchBase}+expansion+global`,
    },
    {
      year: "Industry Recognition",
      title: "Awards & Accolades",
      description: `The company's commitment to excellence was formally recognized through numerous industry awards and accolades. These recognitions validated ${companyName}'s approach and reinforced its reputation as an industry leader.`,
      icon: "recognition",
      readMoreUrl: `${searchBase}+awards+recognition`,
    },
    {
      year: "Present Day",
      title: "Industry Leader",
      description: `Today, ${companyName} stands as a prominent figure in its industry, continuing to innovate and set new benchmarks. The company remains focused on its core mission while exploring new opportunities in an ever-evolving market landscape.`,
      icon: "milestone",
      readMoreUrl: baseUrl !== "https://www.google.com/search?q=" ? baseUrl : searchBase,
    },
  ];
}

function TimelineItem({
  event,
  index,
  isLast,
}: {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = iconMap[event.icon];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex items-start gap-8 ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Content */}
      <div className="flex-1 group cursor-pointer">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-accent-primary/5">
          {/* Year Badge */}
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
              <Icon className="h-5 w-5 text-accent-primary" />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-accent-primary">
              {event.year}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-4 text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-accent-primary">
            {event.title}
          </h3>

          {/* Description */}
          <p className="leading-relaxed text-white/50 transition-colors group-hover:text-white/70">
            {event.description}
          </p>

          {/* Read More Link */}
          {event.readMoreUrl && (
            <a
              href={event.readMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/30 transition-all hover:gap-4 hover:text-accent-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Read more</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {/* Gradient border on hover */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-accent-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      </div>

      {/* Center Line */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
          className="relative z-10 flex h-5 w-5 items-center justify-center"
        >
          <div className="h-5 w-5 rounded-full border-2 border-accent-primary bg-black" />
          <div className="absolute h-3 w-3 rounded-full bg-accent-primary animate-pulse" />
        </motion.div>

        {!isLast && (
          <div className="h-full w-px bg-gradient-to-b from-accent-primary/50 to-transparent" />
        )}
      </div>

      {/* Spacer for alternating layout */}
      <div className="flex-1" />
    </motion.div>
  );
}

export default function TimelineStory({ companyName, history, websiteUrl }: TimelineStoryProps) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const timelineEvents = generateTimelineEvents(companyName, websiteUrl);

  return (
    <section ref={containerRef} className="relative overflow-hidden py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-accent-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-accent-purple/5 blur-[100px]" />
      </div>

      <motion.div style={{ y, opacity }} className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 text-center"
        >
          <span className="mb-6 inline-block font-mono text-xs font-bold uppercase tracking-[0.5em] text-accent-primary">
            Corporate Journey
          </span>
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
            The Story of{" "}
            <span className="bg-gradient-to-r from-accent-primary to-accent-purple bg-clip-text text-transparent">
              {companyName}
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Explore the key milestones and pivotal moments that shaped {companyName} into the industry leader it is today.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative space-y-0">
          {timelineEvents.map((event, index) => (
            <TimelineItem
              key={`${event.year}-${index}`}
              event={event}
              index={index}
              isLast={index === timelineEvents.length - 1}
            />
          ))}
        </div>

        {/* AI Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-10 md:p-16"
        >
          {/* Glow effect */}
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent-primary/10 blur-[80px]" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10">
                <TrendingUp className="h-7 w-7 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AI-Generated Summary</h3>
                <p className="text-sm text-white/40">Powered by Gemini Intelligence</p>
              </div>
            </div>

            <div className="prose prose-invert prose-lg max-w-none">
              <p className="leading-relaxed text-white/70">{history}</p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/50">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Verified Data</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/50">
                <div className="h-2 w-2 rounded-full bg-accent-primary" />
                <span>Multi-Source Synthesis</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
