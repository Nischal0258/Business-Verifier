"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useScroll, useTransform } from "framer-motion";

function ParticleGlobe({ scrollYProgress }: { scrollYProgress: any }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const sphereRef = useRef<THREE.Mesh>(null!);

  // Generate particles around a sphere
  const [positions] = useMemo(() => {
    const count = 3500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Math to distribute points evenly on a sphere
      const r = 2.4; // Base radius
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Add slight noise to the radius for depth
      const radius = r + (Math.random() - 0.5) * 0.15;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return [pos];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.05;
      pointsRef.current.rotation.x -= delta * 0.02;
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.03;
      sphereRef.current.rotation.x += delta * 0.01;
    }
    
    // Slight pulsing effect based on time
    const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    if (pointsRef.current) {
        pointsRef.current.scale.set(scale, scale, scale);
    }
  });

  // Use scroll progress to rotate the globe further down the page
  const scrollRotationX = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 1.5]);
  const scrollRotationY = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 2]);
  
  // We apply the framer-motion scroll transforms in a slightly different way for 3D
  // by reading them in the useFrame, but let's just use the native useFrame rotation
  // for a smoother infinite effect that is always active.

  return (
    <group rotation={[Math.PI / 6, 0, 0]}>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#f59e0b" // Amber
          size={0.018}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Inner Wireframe Globe */}
      <Sphere ref={sphereRef} args={[2.3, 32, 32]}>
        <meshBasicMaterial 
          color="#ea580c" // Orange
          wireframe 
          transparent 
          opacity={0.08} 
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Core Glow */}
      <Sphere args={[2.0, 16, 16]}>
        <meshBasicMaterial 
          color="#f59e0b"
          transparent 
          opacity={0.03} 
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}

export default function CentralDesign3D() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-transparent flex items-center justify-center overflow-hidden">
      <div className="w-full h-full max-w-[1200px] max-h-[1200px] opacity-60">
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.5} />
          <ParticleGlobe scrollYProgress={scrollYProgress} />
        </Canvas>
      </div>
    </div>
  );
}
