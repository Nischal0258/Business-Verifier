"use client";

import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { ArrowRight, X, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Play } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";

interface AnimatedHeroProps {
  onSearch: (query: string) => void;
}

/* ── Auth Modal ── */
function AuthModal({
  mode,
  onClose,
  onSwitch,
}: {
  mode: "login" | "signup";
  onClose: () => void;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if user becomes authenticated
  useEffect(() => {
    if (user && (mode === "login" || mode === "signup")) {
      router.push("/dashboard");
    }
  }, [user, mode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // router.push("/dashboard") will be handled by useEffect
    } catch (err: any) {
      const errorCode = err?.code;
      let errorMessage = err?.message || "An error occurred during authentication.";

      if (errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password") {
        errorMessage = "Invalid email or password.";
      } else if (errorCode === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (errorCode === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (errorCode === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (errorCode === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      const provider = new GoogleAuthProvider();
      // Set custom parameters to force account selection if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // router.push("/dashboard") will be handled by useEffect
    } catch (err: any) {
      const errorCode = err?.code;
      let errorMessage = err?.message || "An error occurred with Google Sign-In.";

      if (errorCode === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      } else if (errorCode === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in popup was closed.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "var(--surface)",
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Glow accent */}
          <div
            className="absolute -top-20 -right-20 w-48 h-48 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
          >
            <X className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
          </button>

          {/* Header */}
          <div className="mb-8 relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(to bottom right, var(--accent-primary), var(--accent-secondary))" }}>
              <ShieldCheck className="w-6 h-6" style={{ color: "var(--background)" }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--foreground-muted)" }}>
              {mode === "login"
                ? "Sign in to access your verification dashboard"
                : "Start verifying businesses in minutes"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {error && (
              <div className="p-3 text-xs font-semibold rounded-xl text-center" style={{ background: "var(--error-muted)", color: "var(--error)" }}>
                {error}
              </div>
            )}
            {mode === "signup" && (
              <div>
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    border: "1px solid rgba(255, 255, 255, 0.15)"
                  }}
                />
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--foreground-muted)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--accent-purple-light)" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl transition-all"
              style={{
                background: "var(--accent-primary)",
                color: "var(--background)"
              }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--foreground-subtle)" }}>
              or continue with
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={handleGoogleSignIn} className="flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--foreground)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--foreground)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Switch mode */}
          <p className="text-center text-sm mt-6" style={{ color: "var(--foreground-muted)" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={onSwitch}
              className="font-semibold transition-colors"
              style={{ color: "var(--accent-primary)" }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── VerifyIQ Logo — Clean Gradient "V" Lettermark (no shield) ── */
function VerifyIQLogo({ size = "default" }: { size?: "default" | "small" }) {
  const s = size === "small" ? 32 : 38;
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <svg width={s} height={s} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--accent-purple-light)" />
              <stop offset="0.5" stopColor="var(--accent-purple)" />
              <stop offset="1" stopColor="var(--accent-violet)" />
            </linearGradient>
            <filter id="logoGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Rounded square background */}
          <rect x="1" y="1" width="36" height="36" rx="10" ry="10"
            fill="url(#logoGrad)" filter="url(#logoGlow)" opacity="0.95" />
          {/* "V" lettermark */}
          <path
            d="M12.5 11L19 27L25.5 11"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Dot accent */}
          <circle cx="19" cy="29" r="1.5" fill="rgba(255,255,255,0.6)" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
          Verify<span style={{ color: "var(--accent-purple-light)" }}>IQ</span>
        </span>
        {size === "default" && (
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] leading-tight" style={{ color: "var(--text-muted)" }}>
            Business Intel
          </span>
        )}
      </div>
    </div>
  );
}

export default function AnimatedHero({ onSearch }: AnimatedHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

  // suppress unused warning — onSearch kept for API compat with dashboard route
  void onSearch;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section
        ref={containerRef}
        className="relative min-h-screen flex flex-col overflow-hidden bg-transparent"
      >
        {/* ── Navbar ── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="relative z-30 flex items-center justify-between px-8 md:px-16 py-4 rounded-2xl mx-8 mt-4 glass-nav"
        >
          {/* Logo */}
          <VerifyIQLogo />

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { label: "About", href: "about" },
              { label: "Features", href: "features" },
              { label: "Pricing", href: "pricing" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="glass-nav text-sm font-medium transition-all duration-300 cursor-pointer px-5 py-2.5 rounded-xl"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthMode("login")}
              className="glass-nav hidden sm:flex items-center gap-2 text-sm py-2.5 px-5 rounded-xl transition-all duration-300"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className="glass-nav flex items-center gap-2 text-sm py-2.5 px-5 rounded-xl transition-all duration-300"
              style={{ color: "var(--accent-primary-light)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212, 175, 55, 0.15)";
                e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              Sign up
            </button>
          </div>
        </motion.nav>

        {/* ── Hero Content (Restore marketing content for landing page) ── */}
        <div className="relative z-20 flex-1 flex items-center justify-center px-6">
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="text-center max-w-3xl mx-auto relative"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.15em]"
                style={{
                  background: "var(--accent-glow)",
                  color: "var(--accent-purple-light)",
                  border: "1px solid var(--accent-glow)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Neural Business Intelligence · V2.0
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="text-5xl sm:text-6xl md:text-[4.5rem] font-extrabold leading-[1.05] tracking-tight mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Verify with{" "}
              <span className="text-accent-primary font-bold">
                Total Confidence
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              The world&apos;s most advanced engine for corporate transparency.
              Instant verification, risk assessment, and financial deep-dives.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center justify-center gap-4"
            >
              <button
                onClick={() => setAuthMode("signup")}
                className="glass-nav flex items-center gap-3 py-4 px-8 rounded-xl text-base font-semibold transition-all duration-300"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex items-center justify-center gap-6 mt-8"
            >
              {[
                { label: "Enterprise Grade", icon: "🔒" },
                { label: "Real-time Data", icon: "⚡" },
                { label: "Global Coverage", icon: "🌍" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-2 text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* ── Floating Stat Cards ── */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Left floating card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="absolute left-[8%] bottom-[28%] animate-float-card-left"
          >
            <div className="glass-card-float px-5 py-4 w-56">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Verified Today
                </span>
                <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, var(--accent-purple), var(--accent-violet))" }}>
                  <ArrowRight className="w-3 h-3 text-white" />
                </span>
              </div>
              <span className="text-xl font-bold block" style={{ color: "var(--foreground)" }}>12,847</span>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                Companies verified
              </span>
            </div>
          </motion.div>

          {/* Right floating card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="absolute right-[8%] bottom-[18%] animate-float-card-right"
          >
            <div className="glass-card-float px-5 py-4 w-48">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Accuracy
                </span>
                <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(to bottom right, var(--accent-purple), var(--accent-violet))" }}>
                  <ArrowRight className="w-3 h-3 text-white" />
                </span>
              </div>
              <span className="text-3xl font-bold block" style={{ color: "var(--foreground)" }}>96%</span>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.1)" }}>
                <div className="h-full rounded-full" style={{ width: "96%", background: "linear-gradient(to right, var(--accent-primary), var(--accent-primary-light))" }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Auth Modal */}
      <AnimatePresence>
        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSwitch={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export { VerifyIQLogo };
