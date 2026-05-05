"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue, useTransform, MotionValue } from "framer-motion";

export default function InteractiveEffects() {
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const dotSpringConfig = { damping: 25, stiffness: 600, mass: 0.1 };
  const dotX = useSpring(mouseX, dotSpringConfig);
  const dotY = useSpring(mouseY, dotSpringConfig);

  const glowSpringConfig = { damping: 40, stiffness: 80, mass: 2 };
  const glowX = useSpring(mouseX, glowSpringConfig);
  const glowY = useSpring(mouseY, glowSpringConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest(".cursor-pointer") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* ── Noise Texture Overlay ── */}
      <div className="noise-overlay fixed inset-0 pointer-events-none z-[2]" />

      {/* ── Ambient Floating Orbs ── */}
      <FloatingOrb
        className="top-[15%] left-[10%]"
        size={400}
        duration={25}
        delay={0}
      />
      <FloatingOrb
        className="top-[60%] right-[5%]"
        size={300}
        duration={30}
        delay={5}
      />
      <FloatingOrb
        className="bottom-[20%] left-[40%]"
        size={250}
        duration={20}
        delay={10}
      />

      {/* ── Background Nebula Glow ── */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) => `
              radial-gradient(1200px circle at ${x}px ${y}px, var(--accent-primary-muted), transparent 80%),
              radial-gradient(600px circle at ${x}px ${y}px, var(--accent-primary-subtle), transparent 60%)
            `
          ),
        }}
      />

      {/* ── Magnetic Grid ── */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage: useTransform(
            [glowX, glowY],
            ([x, y]) =>
              `radial-gradient(800px circle at ${x}px ${y}px, black, transparent)`
          ),
        }}
      />

      {/* ── Cursor Particle Trail ── */}
      {[...Array(6)].map((_, i) => (
        <CursorParticle key={i} index={i} mouseX={mouseX} mouseY={mouseY} />
      ))}

      {/* ── Premium Cursor Dot ── */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          scale: isHovering ? 2.5 : 1,
        }}
      />

      {/* ── Premium Cursor Ring ── */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border border-white/15 rounded-full pointer-events-none z-[9998]"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering
            ? "rgba(255, 255, 255, 0.06)"
            : "transparent",
          borderColor: isHovering
            ? "rgba(255, 255, 255, 0.4)"
            : "rgba(255, 255, 255, 0.1)",
        }}
      />
    </>
  );
}

function FloatingOrb({
  className,
  size,
  duration,
  delay,
}: {
  className: string;
  size: number;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      className={`fixed pointer-events-none z-0 ${className}`}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.3, 0.15, 0.3, 0],
        scale: [0.8, 1.1, 0.9, 1.05, 0.8],
        x: [0, 30, -20, 15, 0],
        y: [0, -20, 30, -15, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
    </motion.div>
  );
}

function CursorParticle({
  index,
  mouseX,
  mouseY,
}: {
  index: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const springX = useSpring(mouseX, {
    damping: 20 + index * 12,
    stiffness: 180 - index * 25,
  });
  const springY = useSpring(mouseY, {
    damping: 20 + index * 12,
    stiffness: 180 - index * 25,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 w-1 h-1 bg-white rounded-full pointer-events-none z-[9997]"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        opacity: 0.5 - index * 0.08,
        scale: 1 - index * 0.12,
      }}
    />
  );
}
