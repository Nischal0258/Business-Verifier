"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Heart, Share2, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityPage() {
  const [posts] = useState([
    {
      id: 1,
      author: "Aditi S.",
      role: "3rd Year B.Tech",
      avatar: "A",
      content: "Just finished my first interview with a startup I found through the AI Manager here! The trust score was 85, and the vibe during the interview matched the reviews exactly. Any tips for the technical round?",
      likes: 24,
      comments: 8,
      time: "2 hours ago"
    },
    {
      id: 2,
      author: "Rahul M.",
      role: "Recent Grad",
      avatar: "R",
      content: "PSA: Be careful with companies offering 'unpaid internships' with promises of equity later. Unless they are transparent about their cap table, don't do it. Always verify them on Student Hub first.",
      likes: 156,
      comments: 32,
      time: "5 hours ago"
    },
    {
      id: 3,
      author: "Sneha P.",
      role: "MBA Student",
      avatar: "S",
      content: "Is anyone here looking for a co-founder? I have a strong marketing background and I'm looking for a technical partner to build a SaaS tool for campus recruiting. DM me!",
      likes: 45,
      comments: 12,
      time: "1 day ago"
    }
  ]);

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

      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
            <p className="text-white/60">Connect, collaborate, and share your experiences with other students.</p>
          </div>

          {/* New Post Input Box */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea 
                  placeholder="Ask a question or share an experience..." 
                  className="w-full bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 resize-none outline-none h-20"
                ></textarea>
                <div className="flex justify-end mt-2 pt-4 border-t border-white/10">
                  <button className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={post.id} 
                className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative group"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold">
                      {post.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{post.author}</h3>
                      <p className="text-white/40 text-xs">{post.role} • {post.time}</p>
                    </div>
                  </div>
                  <button className="text-white/40 hover:text-white">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <p className="text-white/80 leading-relaxed mb-6 text-sm">{post.content}</p>

                <div className="flex items-center gap-6 text-white/50 text-sm border-t border-white/10 pt-4">
                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    <Heart size={18} /> {post.likes}
                  </button>
                  <button className="flex items-center gap-2 hover:text-white transition-colors">
                    <MessageSquare size={18} /> {post.comments}
                  </button>
                  <button className="flex items-center gap-2 hover:text-white transition-colors ml-auto">
                    <Share2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
