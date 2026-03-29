import { useRef, useCallback } from 'react';
import { AnimationManager } from '../utils/animation';

export function useAnimation() {
  const animationManagerRef = useRef<AnimationManager>(new AnimationManager());

  const startAnimation = useCallback((id: string, duration: number) => {
    animationManagerRef.current.startAnimation(id, duration);
  }, []);

  const updateAnimation = useCallback((id: string, deltaTime: number): number => {
    return animationManagerRef.current.updateAnimation(id, deltaTime);
  }, []);

  const isPlaying = useCallback((id: string): boolean => {
    return animationManagerRef.current.isPlaying(id);
  }, []);

  const getProgress = useCallback((id: string): number => {
    return animationManagerRef.current.getProgress(id);
  }, []);

  return {
    startAnimation,
    updateAnimation,
    isPlaying,
    getProgress,
  };
}
