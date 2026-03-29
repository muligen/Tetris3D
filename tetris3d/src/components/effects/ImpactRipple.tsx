import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_WIDTH, BLOCK_SIZE } from '../../game/Board';
import { Easing } from '../../utils/animation';

interface ImpactRippleProps {
  position: [number, number, number];
  color: number;
  intensity: number; // 0-1
  onComplete?: () => void;
}

// Animation duration in ms
const RIPPLE_DURATION = 600;

export function ImpactRipple({
  position,
  color,
  intensity,
  onComplete,
}: ImpactRippleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // Create ring geometry and material
  const [geometry, material] = useMemo(() => {
    // Fixed size ring, we'll scale it
    const geo = new THREE.RingGeometry(0.5, 0.6, 32);
    geo.rotateX(Math.PI / 2); // Rotate to lie on XZ plane (facing viewer)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(1.5), // Brighten the color
      transparent: true,
      opacity: 0.8 * intensity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    return [geo, mat];
  }, [color, intensity]);

  // Calculate final scale based on board width
  const finalScale = useMemo(() => {
    return BOARD_WIDTH * BLOCK_SIZE * 1.5;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Animation loop
  useFrame(() => {
    if (!meshRef.current || completedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / RIPPLE_DURATION, 1);

    if (progress >= 1) {
      completedRef.current = true;
      meshRef.current.visible = false;
      onComplete?.();
      return;
    }

    // Scale animation using easeOutExpo
    const scaleProgress = Easing.easeOutExpo(progress);
    const scale = 0.2 + scaleProgress * finalScale;
    meshRef.current.scale.set(scale, scale, 1);

    // Opacity fade using easeOutQuad
    const opacityProgress = Easing.easeOutQuad(progress);
    material.opacity = (0.8 * intensity) * (1 - opacityProgress);

    // Z position: move slightly forward (toward viewer) then back
    const zOffset = BLOCK_SIZE * 0.3 * (1 - progress) + BLOCK_SIZE * 0.1;
    meshRef.current.position.z = position[2] + zOffset;
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1], position[2] + BLOCK_SIZE * 0.3]}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    >
      {/* Ring lies on XY plane, facing viewer */}
    </mesh>
  );
}
