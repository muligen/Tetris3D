import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  initialSize: number;
}

interface LandingBurstEffectProps {
  position: [number, number, number];
  color: number;
  intensity: number; // 0-1
  onComplete?: () => void;
}

// Maximum particles for performance
const MAX_PARTICLES = 25;

export function LandingBurstEffect({
  position,
  color,
  intensity,
  onComplete,
}: LandingBurstEffectProps) {
  const particlesRef = useRef<ParticleData[]>([]);
  const meshRef = useRef<THREE.Points>(null);
  const completedRef = useRef(false);
  const aliveCountRef = useRef(0);

  // Calculate particle count based on intensity
  const particleCount = useMemo(() => {
    return Math.floor(15 + intensity * 10); // 15-25 particles
  }, [intensity]);

  // Initialize particles
  useEffect(() => {
    const particles: ParticleData[] = [];
    const baseLife = 300 + Math.random() * 200; // 300-500ms

    for (let i = 0; i < particleCount; i++) {
      // Velocity distribution: mainly XZ outward, Y slightly up
      const vx = (Math.random() - 0.5) * 0.15;
      const vy = Math.random() * 0.08;
      const vz = (Math.random() - 0.5) * 0.1 + 0.05; // Slightly toward viewer

      const size = 0.03 + Math.random() * 0.06;

      particles.push({
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: baseLife + Math.random() * 200,
        size,
        initialSize: size,
      });
    }
    particlesRef.current = particles;
    completedRef.current = false;
    aliveCountRef.current = particleCount;
  }, [position, particleCount]);

  // Create geometry with pre-allocated buffers
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, []);

  // Create material (reused)
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.1,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [color]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Animation loop
  useFrame((_, delta) => {
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;

    let aliveCount = 0;
    const gravity = -0.002; // Gravity per frame
    let needsUpdate = false;

    // Batch update all particles
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      if (particle.life < particle.maxLife) {
        particle.life += delta * 1000;
        aliveCount++;

        // Apply velocity
        particle.position.add(particle.velocity);

        // Apply gravity
        particle.velocity.y += gravity;

        // Update buffer
        const i3 = i * 3;
        positions[i3] = particle.position.x;
        positions[i3 + 1] = particle.position.y;
        positions[i3 + 2] = particle.position.z;

        // Fade out size (optimized calculation)
        const lifeRatio = particle.life / particle.maxLife;
        particle.size = particle.initialSize * (1 - lifeRatio * 0.7);
        sizes[i] = particle.size;

        needsUpdate = true;
      } else if (particle.size > 0) {
        // Hide dead particles (only once)
        const i3 = i * 3;
        positions[i3] = 0;
        positions[i3 + 1] = -1000; // Move off-screen
        positions[i3 + 2] = 0;
        sizes[i] = 0;
        particle.size = 0; // Mark as hidden
        needsUpdate = true;
      }
    }

    // Only flag for update if something changed
    if (needsUpdate) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }

    // Update material opacity based on alive particles (only if changed)
    const prevAliveCount = aliveCountRef.current;
    aliveCountRef.current = aliveCount;

    if (aliveCount !== prevAliveCount) {
      material.opacity = Math.max(0.1, (aliveCount / particles.length) * 0.9);
    }

    // Update mesh visibility (only if needed)
    if (meshRef.current) {
      meshRef.current.visible = aliveCount > 0;
    }

    // Check completion
    if (aliveCount === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return <points ref={meshRef} geometry={geometry} material={material} />;
}
