import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_HEIGHT, BLOCK_SIZE } from '../../game/Board';
import { ExplosionState } from '../../stores/tetrisStore';

const EXPLOSION_DURATION = 800;
const PARTICLE_COUNT = 30;

interface ExplosionEffectProps {
  explosion: ExplosionState;
  onComplete: () => void;
}

export function ExplosionEffect({ explosion, onComplete }: ExplosionEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  // Particle system data
  const particleData = useMemo(() => {
    const particles: Array<{
      position: Float32Array;
      velocity: Float32Array;
      color: THREE.Color;
      size: number;
      life: number;
    }> = [];

    explosion.centers.forEach(([cx, cy]) => {
      const worldX = cx * BLOCK_SIZE + BLOCK_SIZE / 2;
      const worldY = (BOARD_HEIGHT - 1 - cy) * BLOCK_SIZE + BLOCK_SIZE / 2;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.1 + Math.random() * 0.3;
        const upSpeed = 0.1 + Math.random() * 0.2;

        particles.push({
          position: new Float32Array([worldX, worldY, BLOCK_SIZE * 0.25]),
          velocity: new Float32Array([
            Math.cos(angle) * speed,
            upSpeed,
            Math.sin(angle) * speed * 0.5 + 0.1,
          ]),
          color: new THREE.Color().setHSL(
            0.05 + Math.random() * 0.1, // orange-red
            1,
            0.5 + Math.random() * 0.3
          ),
          size: 0.06 + Math.random() * 0.1,
          life: 400 + Math.random() * 400,
        });
      }
    });

    return particles;
  }, [explosion.centers]);

  // Flash meshes for explosion centers
  const flashMeshes = useMemo(() => {
    return explosion.centers.map(([cx, cy]) => {
      const geometry = new THREE.SphereGeometry(BLOCK_SIZE * 0.8, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: explosion.depth > 0 ? 0xff0000 : 0xff6600,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const worldX = cx * BLOCK_SIZE + BLOCK_SIZE / 2;
      const worldY = (BOARD_HEIGHT - 1 - cy) * BLOCK_SIZE + BLOCK_SIZE / 2;
      mesh.position.set(worldX, worldY, BLOCK_SIZE * 0.25);
      return mesh;
    });
  }, [explosion.centers, explosion.depth]);

  // Particle points
  const [geometry, material] = useMemo(() => {
    const count = particleData.length;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return [geo, mat];
  }, [particleData.length]);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / EXPLOSION_DURATION, 1);

    // Update flash meshes
    flashMeshes.forEach((mesh) => {
      if (progress < 0.3) {
        const flashProgress = progress / 0.3;
        mesh.material.opacity = (1 - flashProgress) * 0.9;
        const scale = 1 + flashProgress * 2;
        mesh.scale.setScalar(scale);
      } else {
        mesh.visible = false;
      }
    });

    // Update particles
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;

    let alive = 0;
    particleData.forEach((p, i) => {
      if (elapsed < p.life) {
        alive++;
        // Update velocity (gravity)
        p.velocity[1] -= 0.003;

        // Update position
        p.position[0] += p.velocity[0];
        p.position[1] += p.velocity[1];
        p.position[2] += p.velocity[2];

        positions[i * 3] = p.position[0];
        positions[i * 3 + 1] = p.position[1];
        positions[i * 3 + 2] = p.position[2];

        // Fade color
        const lifeRatio = elapsed / p.life;
        colors[i * 3] = p.color.r * (1 - lifeRatio);
        colors[i * 3 + 1] = p.color.g * (1 - lifeRatio);
        colors[i * 3 + 2] = p.color.b * (1 - lifeRatio);
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
      }
    });

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    // Check completion
    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      flashMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      geometry.dispose();
      material.dispose();
    };
  }, [flashMeshes, geometry, material]);

  return (
    <group ref={groupRef}>
      {flashMeshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
      <points geometry={geometry} material={material} />
    </group>
  );
}
