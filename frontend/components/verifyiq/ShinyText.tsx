"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ShinyTextProps {
  children: ReactNode;
  className?: string;
}

export default function ShinyText({ children, className = "" }: ShinyTextProps) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(100deg, #64CEFB 0%, #64CEFB 40%, #ffffff 50%, #64CEFB 60%, #64CEFB 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      animate={{
        backgroundPosition: ["200% 0%", "-200% 0%"],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}
