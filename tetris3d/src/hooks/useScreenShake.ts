import { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface ScreenShakeState {
  intensity: number;
  duration: number;
  elapsedTime: number;
}

export function useScreenShake() {
  const { camera } = useThree();
  const originalPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const [shakeState, setShakeState] = useState<ScreenShakeState | null>(null);

  const startShake = (intensity: number, duration: number) => {
    // Store original position
    originalPosition.current.copy(camera.position);
    setShakeState({
      intensity,
      duration,
      elapsedTime: 0,
    });
  };

  const updateShake = (deltaTime: number) => {
    if (!shakeState) {
      return;
    }

    const newState = { ...shakeState };
    newState.elapsedTime += deltaTime;

    if (newState.elapsedTime >= newState.duration) {
      // Shake finished, restore original position
      camera.position.copy(originalPosition.current);
      setShakeState(null);
      return;
    }

    // Calculate shake offset using decaying sine wave
    const progress = newState.elapsedTime / newState.duration;
    const decay = 1 - progress; // Linear decay
    const shakeAmount = newState.intensity * decay;

    const offsetX = Math.sin(newState.elapsedTime * 50) * shakeAmount;
    const offsetY = Math.cos(newState.elapsedTime * 40) * shakeAmount;
    const offsetZ = Math.sin(newState.elapsedTime * 60) * shakeAmount;

    camera.position.set(
      originalPosition.current.x + offsetX,
      originalPosition.current.y + offsetY,
      originalPosition.current.z + offsetZ
    );

    setShakeState(newState);
  };

  return {
    startShake,
    updateShake,
    isShaking: shakeState !== null,
  };
}
