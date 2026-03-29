import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_HEIGHT, BLOCK_SIZE } from '../../game/Board';

interface DebrisData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  rotation: THREE.Euler;
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

// Temporary objects for calculations (avoid per-frame allocations)
const dummyMatrix = new THREE.Matrix4();
const dummyPosition = new THREE.Vector3();
const dummyRotation = new THREE.Euler();
const dummyQuaternion = new THREE.Quaternion();
const dummyScale = new THREE.Vector3();

export function DebrisEffect({ cells, combo, onComplete }: DebrisEffectProps) {
  const debrisRef = useRef<DebrisData[]>([]);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
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

  // Initialize debris data
  useEffect(() => {
    const debris: DebrisData[] = [];
    const baseLife = 800;
    const lifeVariance = 200;

    limitedCells.forEach(([x, y, _color]) => {
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
        life: 0,
        maxLife: baseLife + Math.random() * lifeVariance,
      });
    });

    debrisRef.current = debris;
    completedRef.current = false;
  }, [limitedCells, speedMultiplier]);

  // Create instanced mesh with shared geometry and material
  const instancedMesh = useMemo(() => {
    const geometry = new THREE.BoxGeometry(
      BLOCK_SIZE * 0.7,
      BLOCK_SIZE * 0.7,
      BLOCK_SIZE * 0.2
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      roughness: 0.3,
      metalness: 0.5,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, MAX_DEBRIS);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return mesh;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      instancedMesh.geometry.dispose();
      instancedMesh.material.dispose();
      instancedMesh.dispose();
    };
  }, [instancedMesh]);

  // Colors for each instance
  const colorsRef = useRef<THREE.Color[]>([]);

  // Update instance colors when cells change
  useEffect(() => {
    const colors = limitedCells.map(([_, __, color]) => new THREE.Color(color));
    colorsRef.current = colors;

    // Set initial instance colors
    if (instancedRef.current) {
      colors.forEach((color, i) => {
        instancedRef.current!.setColorAt(i, color);
      });
      instancedRef.current.instanceColor!.needsUpdate = true;
    }
  }, [limitedCells]);

  // Animation loop
  useFrame((_, delta) => {
    const instancedMesh = instancedRef.current;
    if (!instancedMesh || completedRef.current) return;

    const debris = debrisRef.current;
    if (debris.length === 0) return;

    const gravity = -0.004;
    let aliveCount = 0;

    debris.forEach((d, i) => {
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

        // Set instance matrix
        dummyPosition.copy(d.position);
        dummyRotation.copy(d.rotation);
        dummyQuaternion.setFromEuler(dummyRotation);
        dummyScale.set(opacity, opacity, opacity); // Scale also controls opacity visual

        dummyMatrix.compose(dummyPosition, dummyQuaternion, dummyScale);
        instancedMesh.setMatrixAt(i, dummyMatrix);

        // Update color with opacity
        const color = colorsRef.current[i];
        if (color) {
          instancedMesh.setColorAt(i, new THREE.Color(color.r * opacity, color.g * opacity, color.b * opacity));
        }
      } else {
        // Hide dead instances
        dummyMatrix.compose(
          new THREE.Vector3(0, -1000, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(0, 0, 0)
        );
        instancedMesh.setMatrixAt(i, dummyMatrix);
      }
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // Check completion
    if (aliveCount === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return <primitive ref={instancedRef} object={instancedMesh} />;
}
