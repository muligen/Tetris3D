import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ComboFlashEffectProps {
  intensity: number; // 0-1
  duration?: number; // ms
}

export function ComboFlashEffect({ intensity, duration = 200 }: ComboFlashEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTimeRef = useRef<number>(Date.now());
  const prevIntensityRef = useRef(0);

  // Reset when intensity changes
  useEffect(() => {
    if (intensity > prevIntensityRef.current) {
      startTimeRef.current = Date.now();
    }
    prevIntensityRef.current = intensity;
  }, [intensity]);

  // Create fullscreen plane
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(100, 100);
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame(() => {
    if (!meshRef.current || intensity <= 0) {
      if (meshRef.current) {
        meshRef.current.visible = false;
      }
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Fade out from initial intensity
    const fadeProgress = 1 - progress;
    material.opacity = intensity * 0.3 * fadeProgress;

    // Position in front of camera
    meshRef.current.position.set(5, 9.5, 25);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false}>
      {/* Fullscreen flash plane */}
    </mesh>
  );
}
