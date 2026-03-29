import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE } from '../../game/Board';
import { DebrisEffect } from './DebrisEffect';

interface LineClearEffectProps {
  rows: number[];
  rowColors?: number[][]; // Colors of each cell in cleared rows
  combo?: number;
  onComplete?: () => void;
}

// Animation durations
const FLASH_DURATION = 150;
const PARTICLE_DURATION = 700;

export function LineClearEffect({
  rows,
  rowColors,
  combo = 1,
  onComplete
}: LineClearEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [showDebris, setShowDebris] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const completedRef = useRef(false);

  // Calculate particle count based on combo and rows
  const particleCountPerRow = useMemo(() => {
    if (combo >= 4) return 90;
    if (combo === 3) return 70;
    if (combo === 2) return 55;
    return 40;
  }, [combo]);

  // Check if this is a Tetris (4 lines)
  const isTetris = rows.length === 4;

  // Create glow mesh for each row
  const glowMeshes = useMemo(() => {
    return rows.map((row) => {
      const geometry = new THREE.BoxGeometry(
        BOARD_WIDTH * BLOCK_SIZE,
        BLOCK_SIZE * 0.5,
        BLOCK_SIZE * 0.8
      );
      const material = new THREE.MeshBasicMaterial({
        color: isTetris ? 0xffd700 : 0xffffff, // Gold for Tetris
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geometry, material);
      // Convert row to Y position (flip Y axis)
      const worldY = (BOARD_HEIGHT - 1 - row) * BLOCK_SIZE + BLOCK_SIZE / 2;
      mesh.position.set(
        (BOARD_WIDTH * BLOCK_SIZE) / 2 - BLOCK_SIZE / 2,
        worldY,
        BLOCK_SIZE * 0.25
      );
      return mesh;
    });
  }, [rows, isTetris]);

  // Prepare debris cells
  const debrisCells = useMemo(() => {
    if (!rowColors || rowColors.length === 0) return [];

    const cells: Array<[number, number, number]> = [];

    rows.forEach((row, rowIndex) => {
      const colors = rowColors[rowIndex];
      if (colors) {
        colors.forEach((color, x) => {
          cells.push([x, row, color]);
        });
      }
    });

    return cells;
  }, [rows, rowColors]);

  // Prepare particle colors (mix in gold for Tetris)
  const particleColors = useMemo(() => {
    if (!rowColors || rowColors.length === 0) {
      // Default cyan color
      return rows.map(() => 0x00ffff);
    }

    const colors: number[] = [];
    rows.forEach((_, rowIndex) => {
      const rowColorArray = rowColors[rowIndex];
      if (rowColorArray) {
        // Pick random colors from the row
        rowColorArray.forEach((color) => {
          colors.push(color);
          // Add gold particles for Tetris
          if (isTetris && Math.random() > 0.7) {
            colors.push(0xffd700);
          }
        });
      }
    });
    return colors;
  }, [rows, rowColors, isTetris]);

  // Animation loop
  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const flashProgress = Math.min(elapsed / FLASH_DURATION, 1);
    const totalProgress = Math.min(elapsed / (FLASH_DURATION + PARTICLE_DURATION), 1);

    // Update glow meshes (flash phase)
    glowMeshes.forEach((mesh) => {
      if (flashProgress < 1) {
        // Flash animation
        const opacity = (1 - flashProgress) * 0.9;
        mesh.material.opacity = opacity;

        // Z position: move toward viewer
        mesh.position.z = BLOCK_SIZE * 0.25 + flashProgress * BLOCK_SIZE * 0.75;

        // Scale pulse
        const pulse = Math.sin(flashProgress * Math.PI * 4) * 0.3 + 1;
        mesh.scale.set(pulse, 1, pulse);
      } else {
        mesh.visible = false;
      }
    });

    // Trigger debris effect at 100ms
    if (elapsed > 100 && !showDebris) {
      setShowDebris(true);
    }

    // Trigger particles at 150ms
    if (elapsed > 150 && !showParticles) {
      setShowParticles(true);
    }

    // Check completion
    if (totalProgress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  // Reset when rows change
  useEffect(() => {
    startTimeRef.current = Date.now();
    setShowDebris(false);
    setShowParticles(false);
    completedRef.current = false;
    glowMeshes.forEach(mesh => {
      mesh.visible = true;
    });
  }, [rows, glowMeshes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose all glow meshes
      glowMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
    };
  }, [glowMeshes]);

  return (
    <group ref={groupRef}>
      {/* Flash effects */}
      {glowMeshes.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}

      {/* Debris effect */}
      {showDebris && debrisCells && debrisCells.length > 0 && (
        <DebrisEffect
          cells={debrisCells}
          combo={combo}
        />
      )}

      {/* Enhanced particles */}
      {showParticles && particleColors.length > 0 && (
        <EnhancedParticles
          rows={rows}
          colors={particleColors}
          countPerRow={particleCountPerRow}
        />
      )}
    </group>
  );
}

// Enhanced particle system with custom colors
interface EnhancedParticlesProps {
  rows: number[];
  colors: number[];
  countPerRow: number;
}

function EnhancedParticles({ rows, colors, countPerRow }: EnhancedParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const particlesDataRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    lives: Float32Array;
    count: number;
  } | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const count = rows.length * countPerRow;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colorsArray = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lives = new Float32Array(count);

    let particleIndex = 0;
    rows.forEach((row) => {
      const worldY = (BOARD_HEIGHT - 1 - row) * BLOCK_SIZE + BLOCK_SIZE / 2;

      for (let i = 0; i < countPerRow; i++) {
        const idx = particleIndex++;

        // Initial position at row center with some spread
        positions[idx * 3] = (BOARD_WIDTH * BLOCK_SIZE) / 2 + (Math.random() - 0.5) * BLOCK_SIZE * 2;
        positions[idx * 3 + 1] = worldY + (Math.random() - 0.5) * BLOCK_SIZE;
        positions[idx * 3 + 2] = BLOCK_SIZE * 0.25;

        // Velocity: scatter outward
        velocities[idx * 3] = (Math.random() - 0.5) * 0.3;
        velocities[idx * 3 + 1] = (Math.random() - 0.5) * 0.3;
        velocities[idx * 3 + 2] = Math.random() * 0.2 + 0.1;

        // Color from available colors
        const color = colors.length > 0
          ? colors[Math.floor(Math.random() * colors.length)]
          : 0x00ffff;
        const threeColor = new THREE.Color(color);
        colorsArray[idx * 3] = threeColor.r;
        colorsArray[idx * 3 + 1] = threeColor.g;
        colorsArray[idx * 3 + 2] = threeColor.b;

        // Size
        sizes[idx] = 0.05 + Math.random() * 0.1;

        // Life
        lives[idx] = 500 + Math.random() * 200;

        particleIndex++;
      }
    });

    particlesDataRef.current = {
      positions,
      velocities,
      colors: colorsArray,
      sizes,
      lives,
      count,
    };
    startTimeRef.current = Date.now();
  }, [rows, colors, countPerRow]);

  const [geometry, material] = useMemo(() => {
    const count = rows.length * countPerRow;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));

    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return [geo, mat];
  }, [rows.length, countPerRow]);

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    if (!particlesRef.current || !particlesDataRef.current) return;

    const data = particlesDataRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const gravity = -0.002;

    const positions = geometry.attributes.position.array as Float32Array;
    const colorAttr = geometry.attributes.color.array as Float32Array;
    const sizeAttr = geometry.attributes.size.array as Float32Array;

    let aliveCount = 0;

    for (let i = 0; i < data.count; i++) {
      const life = data.lives[i];

      if (elapsed < life) {
        aliveCount++;

        // Update velocity
        data.velocities[i * 3 + 1] += gravity;

        // Update position
        data.positions[i * 3] += data.velocities[i * 3];
        data.positions[i * 3 + 1] += data.velocities[i * 3 + 1];
        data.positions[i * 3 + 2] += data.velocities[i * 3 + 2];

        // Copy to geometry
        positions[i * 3] = data.positions[i * 3];
        positions[i * 3 + 1] = data.positions[i * 3 + 1];
        positions[i * 3 + 2] = data.positions[i * 3 + 2];

        // Copy color
        colorAttr[i * 3] = data.colors[i * 3];
        colorAttr[i * 3 + 1] = data.colors[i * 3 + 1];
        colorAttr[i * 3 + 2] = data.colors[i * 3 + 2];

        // Fade size
        const lifeRatio = elapsed / life;
        sizeAttr[i] = data.sizes[i] * (1 - lifeRatio * 0.5);
      } else {
        // Hide dead particles
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
        sizeAttr[i] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;

    particlesRef.current.visible = aliveCount > 0;
  });

  return <points ref={particlesRef} geometry={geometry} material={material} />;
}
