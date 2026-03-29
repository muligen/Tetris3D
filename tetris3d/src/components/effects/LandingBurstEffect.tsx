import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
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
  const particlesRef = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.Points>(null);
  const completedRef = useRef(false);

  // Calculate particle count based on intensity
  const particleCount = useMemo(() => {
    return Math.floor(15 + intensity * 10); // 15-25 particles
  }, [intensity]);

  // Initialize particles
  useEffect(() => {
    const particles: Particle[] = [];
    const baseLife = 300 + Math.random() * 200; // 300-500ms

    for (let i = 0; i < particleCount; i++) {
      // Velocity distribution: mainly XZ outward, Y slightly up
      const vx = (Math.random() - 0.5) * 0.15;
      const vy = Math.random() * 0.08;
      const vz = (Math.random() - 0.5) * 0.1 + 0.05; // Slightly toward viewer

      particles.push({
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: baseLife + Math.random() * 200,
        size: 0.03 + Math.random() * 0.06,
      });
    }
    particlesRef.current = particles;
    completedRef.current = false;
  }, [position, particleCount]);

  // Create geometry and material
  const [geometry, material] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const alphas = new Float32Array(MAX_PARTICLES);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // Create material with custom shader for glow effect
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.1,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return [geo, mat];
  }, [color]);

  // Animation loop
  useFrame((_, delta) => {
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;

    let aliveCount = 0;
    const gravity = -0.002; // Gravity per frame

    particles.forEach((particle, i) => {
      if (particle.life < particle.maxLife) {
        particle.life += delta * 1000;
        aliveCount++;

        // Apply velocity
        particle.position.add(particle.velocity);

        // Apply gravity
        particle.velocity.y += gravity;

        // Update buffer
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;

        // Fade out size
        const lifeRatio = particle.life / particle.maxLife;
        sizes[i] = particle.size * (1 - lifeRatio * 0.7);
      } else {
        // Hide dead particles
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000; // Move off-screen
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    });

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;

    // Update material opacity based on alive particles
    material.opacity = Math.max(0.1, (aliveCount / particles.length) * 0.9);

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
