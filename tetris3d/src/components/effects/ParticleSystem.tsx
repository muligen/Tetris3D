import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

interface ParticleSystemProps {
  count?: number;
  position?: [number, number, number];
  color?: number;
  onComplete?: () => void;
}

export function ParticleSystem({
  count = 50,
  position = [0, 0, 0],
  color = 0xffffff,
  onComplete,
}: ParticleSystemProps) {
  const particlesRef = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.Points>(null);

  useEffect(() => {
    const particles: Particle[] = [];
    const colorObj = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      particles.push({
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        life: 0,
        maxLife: 500 + Math.random() * 500,
        color: colorObj.clone(),
        size: 0.05 + Math.random() * 0.1,
      });
    }
    particlesRef.current = particles;
  }, [count, position, color]);

  const [geometry, material] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    return [geo, mat];
  }, [count]);

  useFrame((_, delta) => {
    const particles = particlesRef.current;
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;
    let aliveCount = 0;
    particles.forEach((particle, i) => {
      if (particle.life < particle.maxLife) {
        particle.life += delta * 1000;
        aliveCount++;
        particle.position.add(particle.velocity);
        particle.velocity.y -= 0.001;
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;
        const alpha = 1 - particle.life / particle.maxLife;
        colors[i * 3] = particle.color.r * alpha;
        colors[i * 3 + 1] = particle.color.g * alpha;
        colors[i * 3 + 2] = particle.color.b * alpha;
        sizes[i] = particle.size * alpha;
      }
    });
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    if (meshRef.current) {
      meshRef.current.visible = aliveCount > 0;
    }
    if (aliveCount === 0 && particles[0]?.life >= particles[0].maxLife) {
      onComplete?.();
    }
  });

  return <points ref={meshRef} geometry={geometry} material={material} />;
}
