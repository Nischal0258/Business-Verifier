"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, Clock, User, LogOut, Settings, History } from "lucide-react";
import ShinyText from "./ShinyText";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function HeroSection({ onSearch }: { onSearch?: (query: string) => void }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { name: "History", href: "#", icon: History },
    { name: "Profile", href: "#", icon: User },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black font-sans selection:bg-white/30">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-60"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">VerifyIQ</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-4 lg:flex">
            {navLinks.map((link) => (
              <div key={link.name} className="group/nav relative">
                <button
                  className="flex items-center gap-2 rounded-full border border-gray-700 bg-black/20 px-5 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-white/30 hover:bg-black/40 hover:text-white"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </button>
                
                {/* Feature Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 translate-y-2 scale-95 opacity-0 transition-all group-hover/nav:translate-y-0 group-hover/nav:scale-100 group-hover/nav:opacity-100 pointer-events-none group-hover/nav:pointer-events-auto">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-2 backdrop-blur-2xl shadow-2xl">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                      {link.name} Actions
                    </div>
                    <div className="space-y-1">
                      {link.name === "History" ? (
                        <>
                          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                            <Clock className="h-3.5 w-3.5" />
                            Recent Searches
                          </button>
                          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                            <ArrowRight className="h-3.5 w-3.5" />
                            Full Audit Log
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                            <Settings className="h-3.5 w-3.5" />
                            Account Settings
                          </button>
                          <button 
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Sign Out
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="text-white lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-0 right-0 top-full mt-4 flex flex-col items-center gap-4 bg-black/90 p-8 backdrop-blur-xl lg:hidden"
            >
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg text-white/80 transition-colors hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#"
                className="flex items-center gap-2 text-lg text-white/80 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                History Profile
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex h-[calc(100vh-100px)] max-w-7xl flex-col items-center justify-center px-6">
        {/* Hero Content */}
        <div className="relative flex w-full flex-col items-center text-center">
          {/* Background Text (VerifyIQ) - centered exactly in screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ zIndex: 1 }}
          >
            <h1
              className="text-[14vw] font-bold tracking-tighter text-white md:text-[15vw]"
              style={{ lineHeight: 0.8 }}
            >
              VerifyIQ
            </h1>
          </motion.div>

          {/* Glassmorphism Search Bar - simplified and moved down */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 120 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="group relative z-20 w-full max-w-4xl"
          >
            <div className="relative flex items-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 px-4 py-2 shadow-2xl backdrop-blur-3xl transition-all duration-500 group-focus-within:border-white/20 group-focus-within:bg-black/60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to verify?"
                className="w-full bg-transparent py-6 text-xl text-white placeholder-white/30 outline-none md:py-8 md:text-2xl"
              />
              <button
                type="submit"
                className="ml-4 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
              >
                <ArrowRight className="h-6 w-6" />
              </button>
            </div>
            {/* Subtle glow effect */}
            <div className="absolute -inset-px -z-10 rounded-[2.5rem] bg-gradient-to-r from-blue-500/15 to-purple-500/15 opacity-0 blur-2xl transition-opacity duration-700 group-focus-within:opacity-100" />
          </motion.form>
        </div>
      </div>
    </section>
  );
}
