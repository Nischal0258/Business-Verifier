"use client";

import { useRef } from "react";
import { Shield, BarChart3, Zap, FileCheck, ArrowRight, Globe, Lock, TrendingUp, Users, Check, Star } from "lucide-react";
import AnimatedHero, { VerifyIQLogo } from "@/components/layout/AnimatedHero";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

import CentralDesign3D from "@/components/layout/CentralDesign3D";

export default function Home() {
  // Landing page only — dashboard is at /dashboard
  const noop = () => {};

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <CentralDesign3D />
      <div className="relative z-10 flex flex-col">
        <AnimatedHero onSearch={noop} />
        <AboutSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}

/* ═══════════════════ ABOUT SECTION ═══════════════════ */
function AboutSection() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: false, margin: "-60px" });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const glowX = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.9]);
  const dividerWidth = useTransform(scrollYProgress, [0.1, 0.4], ["0%", "100%"]);
  const sectionY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  const stats = [
    { value: "50K+", label: "Companies Verified" },
    { value: "99.2%", label: "Accuracy Rate" },
    { value: "180+", label: "Countries Covered" },
    { value: "<3s", label: "Avg. Response Time" },
  ];

  return (
    <section id="about" ref={sectionRef} className="relative py-28 px-6 overflow-hidden bg-transparent">
      {/* Animated gradient divider at top */}
      <motion.div className="absolute top-0 left-0 h-px" style={{ width: dividerWidth, background: "linear-gradient(90deg, transparent, var(--accent-purple), var(--accent-violet), transparent)" }} />

      <motion.div style={{ y: sectionY, opacity: sectionOpacity }} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text with staggered reveals */}
          <div>
            <motion.span initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] mb-6"
              style={{ background: "var(--accent-glow)", color: "var(--accent-purple-light)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              About VerifyIQ
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" style={{ color: "var(--text-primary)" }}>
              Built for teams that need{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, var(--accent-purple), var(--accent-purple-light))" }}>the truth</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              VerifyIQ combines real-time financial intelligence from Yahoo Finance, SEC filings, and global company registries into a single, instant verification engine. No more guessing — get hard data on any public company in seconds.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
              Whether you&apos;re a VC firm evaluating deal flow, a compliance team screening partners, or a journalist investigating corporate structures — VerifyIQ gives you the clarity you need.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }} className="flex flex-wrap gap-4">
              {[
                { icon: Globe, text: "Global Registry Access" },
                { icon: Lock, text: "SOC 2 Compliant" },
                { icon: TrendingUp, text: "Live Market Data" },
              ].map((item, idx) => (
                <motion.div key={item.text} initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.5 + idx * 0.08 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <item.icon className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right — Stats Grid with scale-up animation */}
          <div className="grid grid-cols-2 gap-5">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.04, borderColor: "var(--accent-glow)", transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl text-center cursor-default transition-shadow duration-300 hover:shadow-lg"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: "var(--accent-purple-light)" }}>{s.value}</div>
                <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════ FEATURES SECTION ═══════════════════ */
function FeaturesSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const inView = useInView(sectionRef, { once: false, margin: "-60px" });

  const sectionY = useTransform(scrollYProgress, [0, 0.25], [70, 0]);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const headingScale = useTransform(scrollYProgress, [0.05, 0.25], [0.92, 1]);
  const dividerWidth = useTransform(scrollYProgress, [0.05, 0.35], ["0%", "100%"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const features = [
    { icon: Shield, title: "Neural Verification", desc: "Cross-reference global entities with AI-driven compliance checks and real-time risk assessment.", color: "var(--accent-purple)" },
    { icon: BarChart3, title: "Real-time Analytics", desc: "Advanced revenue visualization with multi-dimensional trend detection powered by live Yahoo Finance data.", color: "var(--accent-purple-light)" },
    { icon: Zap, title: "Instant Sync", desc: "Sync with global company registers, stock exchanges, and credit bureaus in under 3 seconds.", color: "var(--accent-violet)" },
    { icon: FileCheck, title: "Smart Reporting", desc: "One-click PDF reports with executive summaries, risk matrices, and revenue breakdowns.", color: "var(--accent-purple)" },
    { icon: Users, title: "Team Collaboration", desc: "Share verification reports across your organization with role-based access and audit trails.", color: "var(--accent-purple-light)" },
    { icon: Globe, title: "180+ Countries", desc: "Coverage across every major economy — from NYSE to BSE, Companies House to MCA.", color: "var(--accent-violet)" },
  ];

  return (
    <section id="features" ref={sectionRef} className="relative py-28 px-6 overflow-hidden bg-transparent">
      {/* Animated divider */}
      <motion.div className="absolute top-0 left-0 h-px" style={{ width: dividerWidth, background: "linear-gradient(90deg, transparent, var(--accent-violet), var(--accent-purple), transparent)" }} />

      <motion.div style={{ y: sectionY, opacity: sectionOpacity }} className="max-w-6xl mx-auto">
        <motion.div style={{ scale: headingScale }} className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] mb-6"
            style={{ background: "var(--accent-glow)", color: "var(--accent-purple-light)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            Features
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" style={{ color: "var(--text-primary)" }}>
            Advanced Intelligence Toolkit
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Everything you need to assess business legitimacy with confidence and speed.
          </motion.p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => <FeatureCard key={i} {...f} index={i} />)}
        </div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, desc, index, color }: { icon: React.ElementType; title: string; desc: string; index: number; color: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-60px" });
  const row = Math.floor(index / 3);
  const col = index % 3;
  // Cards enter from slightly different angles based on position
  const xOffset = col === 0 ? -20 : col === 2 ? 20 : 0;

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40, x: xOffset, scale: 0.92, rotateX: 8 }}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1, rotateX: 0 } : {}}
      transition={{ delay: row * 0.15 + col * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.25 } }}
      className="group p-7 rounded-2xl transition-all duration-300 cursor-default"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", perspective: "600px" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = `0 8px 40px ${color}10`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: row * 0.15 + col * 0.08 + 0.2 }}
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </motion.div>
      <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-xs font-semibold" style={{ color }}>Learn more</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" style={{ color }} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════ PRICING SECTION ═══════════════════ */
function PricingSection() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: false, margin: "-60px" });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const sectionY = useTransform(scrollYProgress, [0, 0.25], [60, 0]);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const dividerWidth = useTransform(scrollYProgress, [0.05, 0.35], ["0%", "100%"]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.15, 0.9]);

  const plans = [
    {
      name: "Starter", price: "Free", period: "", desc: "For individuals exploring company data",
      features: ["10 verifications / month", "Basic financial data", "Company overview", "PDF export"],
      cta: "Get Started", highlighted: false,
    },
    {
      name: "Professional", price: "$29", period: "/month", desc: "For teams that need deeper insights",
      features: ["Unlimited verifications", "Full revenue history", "AI-powered summaries", "Priority API access", "Team sharing (5 seats)", "Custom branding"],
      cta: "Start Free Trial", highlighted: true,
    },
    {
      name: "Enterprise", price: "Custom", period: "", desc: "For organizations at scale",
      features: ["Everything in Pro", "Unlimited team seats", "SSO & SAML", "Dedicated support", "Custom integrations", "SLA guarantee"],
      cta: "Contact Sales", highlighted: false,
    },
  ];

  return (
    <section id="pricing" ref={sectionRef} className="relative py-28 px-6 overflow-hidden bg-transparent">
      {/* Animated divider */}
      <motion.div className="absolute top-0 left-0 h-px" style={{ width: dividerWidth, background: "linear-gradient(90deg, transparent, var(--accent-purple), var(--accent-purple-light), transparent)" }} />

      <motion.div style={{ y: sectionY, opacity: sectionOpacity }} className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] mb-6"
            style={{ background: "var(--accent-glow)", color: "var(--accent-purple-light)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            Pricing
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" style={{ color: "var(--text-primary)" }}>
            Simple, transparent pricing
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Start free, upgrade when you need more power.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
              className="relative rounded-2xl p-7 flex flex-col cursor-default transition-shadow duration-300"
              style={{
                background: plan.highlighted ? "linear-gradient(165deg, var(--accent-glow), rgba(20,18,40,0.95))" : "var(--bg-card)",
                border: plan.highlighted ? "1px solid var(--accent-glow)" : "1px solid var(--border-subtle)",
                boxShadow: plan.highlighted ? "0 0 60px var(--accent-glow)" : "none",
              }}
            >
              {plan.highlighted && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ delay: 0.6 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg" style={{ background: "linear-gradient(to right, var(--accent-purple), var(--accent-violet))" }}>
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                </motion.div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>{plan.price}</span>
                {plan.period && <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, fIdx) => (
                  <motion.li key={f} initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.15 + fIdx * 0.04 }}
                    className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.highlighted ? "var(--accent-purple)" : "var(--text-muted)" }} />
                    {f}
                  </motion.li>
                ))}
              </ul>
              <button className={plan.highlighted ? "btn-primary-pill w-full py-3 text-sm" : "btn-outline-pill w-full py-3 text-sm"}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════ CTA SECTION ═══════════════════ */
function CTASection() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: false, margin: "-60px" });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const sectionY = useTransform(scrollYProgress, [0, 0.3], [50, 0]);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const dividerWidth = useTransform(scrollYProgress, [0.05, 0.35], ["0%", "100%"]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.2, 0.85]);

  return (
    <section ref={sectionRef} className="relative py-32 px-6 overflow-hidden bg-transparent">
      {/* Animated divider */}
      <motion.div className="absolute top-0 left-0 h-px" style={{ width: dividerWidth, background: "linear-gradient(90deg, transparent, var(--accent-purple), var(--accent-purple-light), transparent)" }} />

      <motion.div style={{ y: sectionY, opacity: sectionOpacity }} className="max-w-3xl mx-auto text-center relative z-10">
        <motion.span initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] mb-6"
          style={{ background: "var(--accent-glow)", color: "var(--accent-purple-light)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
          Ready to Start?
        </motion.span>

        <motion.h2 initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" style={{ color: "var(--text-primary)" }}>
          Start verifying businesses{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, var(--accent-purple), var(--accent-purple-light))" }}>today</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Join thousands of companies using VerifyIQ to make smarter, data-driven decisions. No credit card required.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-4"
            >
              <a href="/dashboard" className="glass-nav flex items-center gap-3 py-4 px-8 rounded-xl text-base font-semibold transition-all duration-300">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

        {/* Trust bar */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-8 mt-12">
          {[
            { label: "No credit card required", icon: "💳" },
            { label: "Free forever plan", icon: "✨" },
            { label: "Cancel anytime", icon: "🔓" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════ FOOTER ═══════════════════ */
function Footer() {
  const footerRef = useRef(null);
  const inView = useInView(footerRef, { once: false, margin: "-40px" });
  const { scrollYProgress } = useScroll({ target: footerRef, offset: ["start end", "end start"] });
  const dividerWidth = useTransform(scrollYProgress, [0, 0.3], ["0%", "100%"]);

  const footerColumns = [
    { title: "Product", links: ["Features", "Pricing", "API Docs", "Changelog"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
  ];

  return (
    <motion.footer ref={footerRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, margin: "-20px" }}
      transition={{ duration: 0.7 }}
      className="relative py-16 px-6 bg-transparent" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      {/* Animated divider at top */}
      <motion.div className="absolute top-0 left-0 h-px" style={{ width: dividerWidth, background: "linear-gradient(90deg, transparent, var(--accent-purple), var(--accent-purple-light), transparent)" }} />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
            className="md:col-span-1">
            <VerifyIQLogo size="small" />
            <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Real-time business verification powered by AI and live financial data.
            </p>
          </motion.div>
          {/* Links — staggered column reveals */}
          {footerColumns.map((col, colIdx) => (
            <motion.div key={col.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + colIdx * 0.1 }}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link, linkIdx) => (
                  <motion.li key={link}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + colIdx * 0.1 + linkIdx * 0.05 }}>
                    <a href="#" className="text-sm transition-colors" style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-purple-light)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                      {link}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        {/* Bottom */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>© 2026 VerifyIQ. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {["Twitter", "LinkedIn", "GitHub"].map((s) => (
              <a key={s} href="#" className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-purple-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                {s}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
