// Animation utility functions

export interface AnimationState {
  progress: number;
  isPlaying: boolean;
  duration: number;
  elapsedTime: number;
}

export class AnimationManager {
  private animations: Map<string, AnimationState> = new Map();

  startAnimation(id: string, duration: number): void {
    this.animations.set(id, {
      progress: 0,
      isPlaying: true,
      duration,
      elapsedTime: 0,
    });
  }

  updateAnimation(id: string, deltaTime: number): number {
    const anim = this.animations.get(id);
    if (!anim || !anim.isPlaying) {
      return 0;
    }

    anim.elapsedTime += deltaTime;
    anim.progress = Math.min(anim.elapsedTime / anim.duration, 1);

    if (anim.progress >= 1) {
      anim.isPlaying = false;
      this.animations.delete(id);
      return 1;
    }

    return anim.progress;
  }

  isPlaying(id: string): boolean {
    const anim = this.animations.get(id);
    return anim ? anim.isPlaying : false;
  }

  getProgress(id: string): number {
    const anim = this.animations.get(id);
    return anim ? anim.progress : 0;
  }
}

// Easing functions
export const Easing = {
  linear: (t: number): number => t,
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  // Squash and stretch easing - simulates elastic collision
  // Returns offset from 1.0 (negative = compressed, positive = stretched)
  easeOutSquash: (t: number): number => {
    if (t < 0.2) {
      // Quick compression phase
      return -0.4 * (1 - Math.pow(t / 0.2, 2));
    } else {
      // Elastic recovery phase
      const t2 = (t - 0.2) / 0.8;
      return Math.sin(t2 * Math.PI * 2.5) * Math.exp(-t2 * 3);
    }
  },
};

// Lerp function
export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

// Vector3 lerp
export function lerpVector3(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  t: number
): { x: number; y: number; z: number } {
  return {
    x: lerp(start.x, end.x, t),
    y: lerp(start.y, end.y, t),
    z: lerp(start.z, end.z, t),
  };
}

// Color lerp
export function lerpColor(color1: number, color2: number, t: number): number {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;

  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));

  return (r << 16) | (g << 8) | b;
}
