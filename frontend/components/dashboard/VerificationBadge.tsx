"use client";

import { motion } from "framer-motion";

interface VerificationBadgeProps {
  is_verified: boolean;
  score: number;
}

export default function VerificationBadge({
  is_verified,
  score,
}: VerificationBadgeProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const statusText = is_verified
    ? "ENTITY_VERIFIED"
    : score >= 50
      ? "RISK_ELEVATED"
      : "ENTITY_UNVERIFIED";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center"
    >
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute inset-[-20px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)`,
          }}
        />
        <svg width="200" height="200" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="1"
          />
          {/* Tick marks */}
          {[...Array(60)].map((_, i) => (
            <line
              key={i}
              x1="60"
              y1="4"
              x2="60"
              y2={i % 5 === 0 ? "8" : "6"}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={i % 5 === 0 ? "0.5" : "0.25"}
              transform={`rotate(${i * 6} 60 60)`}
            />
          ))}
          {/* Main progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
            strokeLinecap="square"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            strokeDasharray={circumference}
            transform="rotate(-90 60 60)"
          />
          {/* Score Text */}
          <text
            x="60"
            y="54"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white font-mono font-bold text-[32px] tracking-tighter"
          >
            {score}
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white/10 font-mono text-[8px] uppercase tracking-[0.3em]"
          >
            Score_Index
          </text>
        </svg>
      </div>
      
      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="h-px w-10 bg-white/10" />
        <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-[0.35em]">
          {statusText}
        </span>
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i < Math.floor(score/20) ? 'bg-white/60' : 'bg-white/[0.04]'}`} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
