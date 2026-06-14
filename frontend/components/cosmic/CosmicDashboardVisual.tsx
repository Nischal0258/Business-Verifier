"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CosmicVisualConfig {
  particleCount: number;
  nebulaIntensity: number;
  blurLevel: number;
  mouseParallaxStrength: number;
  rotationSpeed: number;
}

const defaultConfig: CosmicVisualConfig = {
  particleCount: 3000,
  nebulaIntensity: 0.8,
  blurLevel: 60,
  mouseParallaxStrength: 0.02,
  rotationSpeed: 0.0003,
};

interface CosmicParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface MousePosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface NebulaStop {
  color: string;
  position: number;
  opacity: number;
}

const nebulaGradient: NebulaStop[] = [
  { color: "#D4AF37", position: 0, opacity: 0.15 },
  { color: "#3B6B8C", position: 0.3, opacity: 0.12 },
  { color: "#8B3A3A", position: 0.6, opacity: 0.08 },
  { color: "#D4AF37", position: 1, opacity: 0.05 },
];

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function createGradient(ctx: CanvasRenderingContext2D, width: number, height: number, mouseX: number, mouseY: number, config: CosmicVisualConfig): void {
  const centerX = width / 2 + (mouseX - width / 2) * config.mouseParallaxStrength;
  const centerY = height / 2 + (mouseY - height / 2) * config.mouseParallaxStrength;

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7);

  nebulaGradient.forEach((stop) => {
    gradient.addColorStop(stop.position, hexToRgba(stop.color, stop.opacity * config.nebulaIntensity));
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function initParticles(config: CosmicVisualConfig, width: number, height: number): CosmicParticle[] {
  const particles: CosmicParticle[] = [];
  for (let i = 0; i < config.particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      hue: Math.random() * 60 + 30,
    });
  }
  return particles;
}

function updateParticles(particles: CosmicParticle[], config: CosmicVisualConfig, width: number, height: number, rotation: number, mouseX: number, mouseY: number): void {
  const centerX = width / 2;
  const centerY = height / 2;

  particles.forEach((p) => {
    const angle = Math.atan2(p.y - centerY, p.x - centerX);
    const distance = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);

    p.x += p.vx + Math.cos(angle + rotation) * config.rotationSpeed * (1000 - p.z) * 0.01;
    p.y += p.vy + Math.sin(angle + rotation) * config.rotationSpeed * (1000 - p.z) * 0.01;

    const parallaxX = (mouseX - centerX) * config.mouseParallaxStrength * (1000 - p.z) * 0.00002;
    const parallaxY = (mouseY - centerY) * config.mouseParallaxStrength * (1000 - p.z) * 0.00002;
    p.x += parallaxX;
    p.y += parallaxY;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: CosmicParticle[], config: CosmicVisualConfig): void {
  particles.forEach((p) => {
    const depthFactor = (1000 - p.z) / 1000;
    const size = p.size * depthFactor;
    const opacity = p.opacity * depthFactor;

    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
    gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${opacity})`);
    gradient.addColorStop(0.5, `hsla(${p.hue}, 60%, 50%, ${opacity * 0.5})`);
    gradient.addColorStop(1, `hsla(${p.hue}, 50%, 30%, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStarConnections(ctx: CanvasRenderingContext2D, particles: CosmicParticle[], maxDistance: number): void {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        const depthFactor = ((1000 - particles[i].z) / 1000 + (1000 - particles[j].z) / 1000) / 2;
        const opacity = (1 - distance / maxDistance) * 0.15 * depthFactor;

        ctx.strokeStyle = `rgba(100, 206, 251, ${opacity})`;
        ctx.lineWidth = 0.5 * depthFactor;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

export interface CosmicDashboardVisualProps {
  className?: string;
  config?: Partial<CosmicVisualConfig>;
  reducedMotion?: boolean;
}

export default function CosmicDashboardVisual({
  className = "",
  config = {},
  reducedMotion = false,
}: CosmicDashboardVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<CosmicParticle[]>([]);
  const rotationRef = useRef(0);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const lastFrameTimeRef = useRef(0);
  const fpsHistoryRef = useRef<number[]>([]);

  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [fps, setFps] = useState(60);

  const mergedConfig: CosmicVisualConfig = { ...defaultConfig, ...config };

  const smoothMouse = useCallback((mouse: MousePosition, smoothing: number = 0.08) => {
    mouse.x += (mouse.targetX - mouse.x) * smoothing;
    mouse.y += (mouse.targetY - mouse.y) * smoothing;
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!canvasRef.current || !isClient) return;

    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    const currentFps = deltaTime > 0 ? 1000 / deltaTime : 60;
    fpsHistoryRef.current.push(currentFps);
    if (fpsHistoryRef.current.length > 30) {
      fpsHistoryRef.current.shift();
    }
    const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
    setFps(Math.round(avgFps));

    if (avgFps < 20) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasRef.current;

    smoothMouse(mouseRef.current);

    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, width, height);

    createGradient(ctx, width, height, mouseRef.current.x, mouseRef.current.y, mergedConfig);

    if (!reducedMotion) {
      rotationRef.current += mergedConfig.rotationSpeed * deltaTime;
    }

    updateParticles(particlesRef.current, mergedConfig, width, height, rotationRef.current, mouseRef.current.x, mouseRef.current.y);
    drawStarConnections(ctx, particlesRef.current, 150);
    drawParticles(ctx, particlesRef.current, mergedConfig);

    animationRef.current = requestAnimationFrame(animate);
  }, [isClient, mergedConfig, reducedMotion, smoothMouse]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (containerRef.current && e.touches.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.targetX = e.touches[0].clientX - rect.left;
      mouseRef.current.targetY = e.touches[0].clientY - rect.top;
    }
  }, []);

  const handleResize = useCallback(() => {
    if (containerRef.current && canvasRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = containerRef.current.getBoundingClientRect();

      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      canvasRef.current.style.width = `${rect.width}px`;
      canvasRef.current.style.height = `${rect.height}px`;

      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (particlesRef.current.length === 0) {
        particlesRef.current = initParticles(mergedConfig, rect.width, rect.height);
      }
    }
  }, [mergedConfig]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setIsWebGLSupported(!!gl);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isClient, animate, handleResize, handleMouseMove, handleTouchMove]);

  if (!isClient) {
    return (
      <div className={`cosmic-static-fallback ${className}`} style={{ background: "linear-gradient(135deg, #0A0F1C 0%, #111827 50%, #0A0F1C 100%)" }}>
        <noscript>
          <style>{`
            .cosmic-static-fallback {
              background: linear-gradient(135deg, #0A0F1C 0%, #111827 50%, #0A0F1C 100%);
            }
          `}</style>
        </noscript>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ background: "var(--background-muted)" }}
    >
      {isWebGLSupported && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ filter: `blur(${mergedConfig.blurLevel}px)` }}
          aria-hidden="true"
        />
      )}

      {!isWebGLSupported && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(100, 206, 251, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(139, 58, 58, 0.08) 0%, transparent 60%),
              linear-gradient(180deg, #0A0F1C 0%, #111827 100%)
            `,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(10, 15, 28, 0.3) 0%, transparent 20%, transparent 80%, rgba(10, 15, 28, 0.5) 100%)",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(100, 206, 251, 0.4) 0%, transparent 0.5%),
            radial-gradient(circle at 80% 70%, rgba(100, 206, 251, 0.3) 0%, transparent 0.3%),
            radial-gradient(circle at 40% 80%, rgba(100, 206, 251, 0.2) 0%, transparent 0.4%),
            radial-gradient(circle at 60% 20%, rgba(100, 206, 251, 0.35) 0%, transparent 0.3%),
            radial-gradient(circle at 90% 40%, rgba(100, 206, 251, 0.25) 0%, transparent 0.5%),
            radial-gradient(circle at 10% 60%, rgba(100, 206, 251, 0.3) 0%, transparent 0.4%)
          `,
          backgroundSize: "100% 100%",
        }}
        aria-hidden="true"
      />

      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-2 right-2 text-[8px] font-mono text-foreground-disabled opacity-50">
          FPS: {fps}
        </div>
      )}
    </div>
  );
}

export function useCosmicVisualPerformance() {
  const [gpuUsage, setGpuUsage] = useState<number>(0);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

      if (!gl) {
        setIsLowEndDevice(true);
        return;
      }

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const lowEndKeywords = ["Intel", "Mali-4", "Adreno 3", "PowerVR"];

        if (lowEndKeywords.some((keyword) => renderer.includes(keyword))) {
          setIsLowEndDevice(true);
        }
      }

      if (typeof window !== "undefined" && "deviceMemory" in navigator) {
        const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
        if (memory && memory < 4) {
          setIsLowEndDevice(true);
        }
      }
    }
  }, []);

  return { gpuUsage, isLowEndDevice };
}
