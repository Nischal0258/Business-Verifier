"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AdvancedCursorProps {
  className?: string;
  globeSelector?: string;
  interactiveElements?: string[];
}

export default function AdvancedCursor({
  className = "",
  globeSelector = ".globe-container",
  interactiveElements = ["button", "a", "input", "textarea", "[role='button']", "[tabindex]"]
}: AdvancedCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringGlobe, setIsHoveringGlobe] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const mouseX = useSpring(0, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(0, { stiffness: 300, damping: 30 });

  const cursorScale = useTransform(
    [mouseX, mouseY],
    () => isHoveringGlobe ? 1.5 : isHoveringInteractive ? 0.8 : 1
  );

  const ringScale = useTransform(
    [mouseX, mouseY],
    () => isHoveringGlobe ? 2 : isHoveringInteractive ? 1.2 : 1
  );

  const ringOpacity = useTransform(
    [mouseX, mouseY],
    () => isHoveringGlobe ? 0.6 : isHoveringInteractive ? 0.3 : 0.8
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const checkGlobeHover = useCallback((e: MouseEvent) => {
    const globeElement = document.querySelector(globeSelector);
    if (!globeElement) return;

    const rect = globeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
    );
    const radius = Math.max(rect.width, rect.height) / 2;

    setIsHoveringGlobe(distance < radius * 1.5);
  }, [globeSelector]);

  const checkInteractiveHover = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const selectors = interactiveElements.join(", ");
    const isInteractive = target.matches(selectors) || target.closest(selectors) !== null;
    setIsHoveringInteractive(isInteractive);
  }, [interactiveElements]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(prefersReducedMotion.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    prefersReducedMotion.addEventListener("change", handleMediaChange);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mousemove", checkGlobeHover);
    document.addEventListener("mousemove", checkInteractiveHover);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousemove", checkGlobeHover);
      document.removeEventListener("mousemove", checkInteractiveHover);
      prefersReducedMotion.removeEventListener("change", handleMediaChange);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, checkGlobeHover, checkInteractiveHover]);

  if (isReducedMotion) return null;

  return (
    <motion.div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] ${className}`}
      style={{
        x: mouseX,
        y: mouseY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Outer ring */}
      <motion.div
        ref={ringRef}
        className="absolute inset-0 rounded-full border-2"
        style={{
          width: 40,
          height: 40,
          borderColor: isHoveringGlobe 
            ? "rgba(100, 206, 251, 0.8)" 
            : isHoveringInteractive 
              ? "rgba(250, 248, 245, 0.6)" 
              : "rgba(250, 248, 245, 0.4)",
          scale: ringScale,
          opacity: ringOpacity,
          backgroundColor: isHoveringGlobe 
            ? "rgba(100, 206, 251, 0.1)" 
            : "transparent",
        }}
        animate={{
          borderWidth: isHoveringGlobe ? 3 : 2,
        }}
      />

      {/* Inner dot */}
      <motion.div
        ref={dotRef}
        className="absolute inset-0 rounded-full"
        style={{
          width: 8,
          height: 8,
          backgroundColor: isHoveringGlobe 
            ? "rgba(100, 206, 251, 1)" 
            : isHoveringInteractive 
              ? "rgba(250, 248, 245, 0.9)" 
              : "rgba(250, 248, 245, 0.8)",
          scale: cursorScale,
          left: "50%",
          top: "50%",
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHoveringGlobe ? 12 : isHoveringInteractive ? 4 : 8,
          height: isHoveringGlobe ? 12 : isHoveringInteractive ? 4 : 8,
        }}
      />

      {/* Globe interaction indicator */}
      {isHoveringGlobe && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: 60,
            height: 60,
            left: "50%",
            top: "50%",
            translateX: "-50%",
            translateY: "-50%",
            border: "1px solid rgba(100, 206, 251, 0.3)",
            boxShadow: "0 0 20px rgba(100, 206, 251, 0.2)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Text selection indicator */}
      {isHoveringInteractive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: 20,
            height: 20,
            left: "50%",
            top: "50%",
            translateX: "-50%",
            translateY: "-50%",
            backgroundColor: "rgba(250, 248, 245, 0.1)",
          }}
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        />
      )}
    </motion.div>
  );
}

export function useGlobeCursor() {
  const [isGlobeHovered, setIsGlobeHovered] = useState(false);

  const handleGlobeEnter = useCallback(() => {
    setIsGlobeHovered(true);
  }, []);

  const handleGlobeLeave = useCallback(() => {
    setIsGlobeHovered(false);
  }, []);

  return {
    isGlobeHovered,
    handleGlobeEnter,
    handleGlobeLeave,
  };
}
