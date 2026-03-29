import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_HEIGHT, BLOCK_SIZE } from '../../game/Board';

interface Debris {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  rotation: THREE.Euler;
  color: number;
  life: number;
  maxLife: number;
}

interface DebrisEffectProps {
  // Array of [x, y, color] for each cell in cleared rows
  cells: Array<[number, number, number]>;
  combo: number;
  onComplete?: () => void;
}

// Performance limit
const MAX_DEBRIS = 200;

export function DebrisEffect({ cells, combo, onComplete }: DebrisEffectProps) {
  const debrisRef = useRef<Debris[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const completedRef = useRef(false);

  // Calculate speed multiplier based on combo
  const speedMultiplier = useMemo(() => {
    if (combo >= 4) return 2.0;
    if (combo === 3) return 1.6;
    if (combo === 2) return 1.3;
    return 1.0;
  }, [combo]);

  // Limit debris count for performance
  const limitedCells = useMemo(() => {
    if (cells.length <= MAX_DEBRIS) return cells;
    // Randomly sample to stay within limit
    const shuffled = [...cells].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, MAX_DEBRIS);
  }, [cells]);

  // Initialize debris
  useEffect(() => {
    const debris: Debris[] = [];
    const baseLife = 800;
    const lifeVariance = 200;

    limitedCells.forEach(([x, y, color]) => {
      // Convert to world coordinates
      const worldX = x * BLOCK_SIZE + BLOCK_SIZE / 2;
      const worldY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
      const worldZ = BLOCK_SIZE * 0.25;

      // Velocity: scatter outward with upward bias
      const vx = (Math.random() - 0.5) * 0.3 * speedMultiplier;
      const vy = (Math.random() * 0.15 + 0.1) * speedMultiplier; // Upward
      const vz = (Math.random() * 0.2 + 0.05) * speedMultiplier; // Toward viewer

      // Rotation speed
      const rx = (Math.random() - 0.5) * 10;
      const ry = (Math.random() - 0.5) * 10;
      const rz = (Math.random() - 0.5) * 10;

      debris.push({
        position: new THREE.Vector3(worldX, worldY, worldZ),
        velocity: new THREE.Vector3(vx, vy, vz),
        rotationSpeed: new THREE.Vector3(rx, ry, rz),
        rotation: new THREE.Euler(0, 0, 0),
        color,
        life: 0,
        maxLife: baseLife + Math.random() * lifeVariance,
      });
    });

    debrisRef.current = debris;
    completedRef.current = false;
  }, [limitedCells, speedMultiplier]);

  // Animation loop
  useFrame((_, delta) => {
    if (!groupRef.current || completedRef.current) return;

    const debris = debrisRef.current;
    if (debris.length === 0) return;

    const gravity = -0.004;
    let aliveCount = 0;

    // Clear previous meshes
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    debris.forEach((d) => {
      if (d.life < d.maxLife) {
        d.life += delta * 1000;
        aliveCount++;

        // Update velocity
        d.velocity.y += gravity;

        // Update position
        d.position.add(d.velocity);

        // Update rotation
        d.rotation.x += d.rotationSpeed.x * delta;
        d.rotation.y += d.rotationSpeed.y * delta;
        d.rotation.z += d.rotationSpeed.z * delta;

        // Calculate opacity fade
        const lifeRatio = d.life / d.maxLife;
        const opacity = lifeRatio > 0.8 ? 1 - (lifeRatio - 0.8) / 0.2 : 1;

        // Create debris mesh
        const geometry = new THREE.BoxGeometry(
          BLOCK_SIZE * 0.7,
          BLOCK_SIZE * 0.7,
          BLOCK_SIZE * 0.2
        );
        const material = new THREE.MeshStandardMaterial({
          color: d.color,
          transparent: true,
          opacity,
          roughness: 0.3,
          metalness: 0.5,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(d.position);
        mesh.rotation.copy(d.rotation);

        groupRef.current!.add(mesh);
      }
    });

    // Check completion
    if (aliveCount === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return <group ref={groupRef} />;
}
