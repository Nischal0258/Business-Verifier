"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Star, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedbackPage() {
  const feedbacks = [
    { id: 1, name: "Rahul S.", role: "Computer Science Student", rating: 5, text: "The Student Hub AI helped me find a startup that perfectly matched my skill set. I got an internship within 2 weeks!", date: "2 days ago" },
    { id: 2, name: "Priya M.", role: "MBA Candidate", rating: 4, text: "I love the transparency. Seeing the trust scores before applying saves me so much time avoiding toxic workplaces.", date: "1 week ago" },
    { id: 3, name: "Ananya K.", role: "Design Intern", rating: 5, text: "The company review insights pulled by the AI agent were spot on. The culture here is exactly as described.", date: "2 weeks ago" },
    { id: 4, name: "Vikram R.", role: "Engineering Grad", rating: 4, text: "Great platform for finding early-stage startups that actually pay their interns.", date: "1 month ago" },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-white/20 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none z-0"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4" type="video/mp4" />
      </video>
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Navbar */}
      <div className="w-full px-6 md:px-12 lg:px-16 pt-6">
        <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium text-sm">Back to Dashboard</span>
          </Link>
          <div className="text-2xl font-semibold tracking-tight">Student Hub</div>
          <div className="w-32"></div> 
        </nav>
      </div>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Student Feedback</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">Real experiences from students who have used the platform to discover internships and verify companies.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {feedbacks.map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={item.id} 
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.02] transition-colors relative group"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-white/50 text-sm">{item.role}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < item.rating ? "text-white fill-white" : "text-white/20"} />
                  ))}
                </div>
              </div>
              <p className="text-white/80 leading-relaxed mb-6">"{item.text}"</p>
              <div className="flex justify-between items-center text-xs text-white/40 border-t border-white/10 pt-4 mt-auto">
                <span>{item.date}</span>
                <button className="flex items-center gap-1 hover:text-white transition-colors">
                  <ThumbsUp size={14} /> Helpful
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      </div>
    </div>
  );
}
