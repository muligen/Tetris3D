import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Throttle twinkle updates to every 3 frames
const TWINKLE_THROTTLE = 3;

export function EnhancedBackground() {
  const stars1Ref = useRef<THREE.Points>(null);
  const stars2Ref = useRef<THREE.Points>(null);
  const nebulaRef = useRef<THREE.Mesh>(null);
  const frameCountRef = useRef(0);

  // Create three layers of stars for depth
  const [stars1, stars2] = useMemo(() => {
    // Layer 1 - Small distant stars
    const geo1 = new THREE.BufferGeometry();
    const count1 = 3000;
    const positions1 = new Float32Array(count1 * 3);
    const colors1 = new Float32Array(count1 * 3);
    const twinkleOffsets1 = new Float32Array(count1); // Pre-calculate random offsets

    for (let i = 0; i < count1; i++) {
      const i3 = i * 3;
      const radius = 80 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions1[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions1[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5 + 10; // 扁平化Y轴
      positions1[i3 + 2] = radius * Math.cos(phi) - 20; // 将背景推到更远的位置

      // White/blue tinted stars
      const brightness = 0.5 + Math.random() * 0.5;
      colors1[i3] = brightness;
      colors1[i3 + 1] = brightness;
      colors1[i3 + 2] = brightness + Math.random() * 0.2;

      // Random offset for twinkle phase
      twinkleOffsets1[i] = Math.random() * Math.PI * 2;
    }

    geo1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
    geo1.setAttribute('color', new THREE.BufferAttribute(colors1, 3));
    geo1.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets1, 1));

    const mat1 = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Layer 2 - Brighter closer stars
    const geo2 = new THREE.BufferGeometry();
    const count2 = 1000;
    const positions2 = new Float32Array(count2 * 3);
    const colors2 = new Float32Array(count2 * 3);
    const baseColors2 = new Float32Array(count2 * 3); // Store base colors
    const sizes2 = new Float32Array(count2);
    const twinkleOffsets2 = new Float32Array(count2); // Pre-calculate random offsets

    for (let i = 0; i < count2; i++) {
      const i3 = i * 3;
      const radius = 40 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions2[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions2[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5 + 10; // 扁平化Y轴
      positions2[i3 + 2] = radius * Math.cos(phi) - 15; // 将背景推到更远的位置

      // More colorful bright stars
      const hue = Math.random() * 0.2 + 0.5; // Blue to purple range
      const color = new THREE.Color().setHSL(hue, 0.5, 0.8);
      colors2[i3] = color.r;
      colors2[i3 + 1] = color.g;
      colors2[i3 + 2] = color.b;

      // Store base colors for twinkle calculation
      baseColors2[i3] = color.r;
      baseColors2[i3 + 1] = color.g;
      baseColors2[i3 + 2] = color.b;

      sizes2[i] = 0.2 + Math.random() * 0.3;

      // Random offset for twinkle phase
      twinkleOffsets2[i] = Math.random() * Math.PI * 2;
    }

    geo2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
    geo2.setAttribute('color', new THREE.BufferAttribute(colors2, 3));
    geo2.setAttribute('size', new THREE.BufferAttribute(sizes2, 1));
    geo2.setAttribute('baseColor', new THREE.BufferAttribute(baseColors2, 3));
    geo2.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets2, 1));

    const mat2 = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    return [
      new THREE.Points(geo1, mat1),
      new THREE.Points(geo2, mat2),
    ];
  }, []);

  // Create nebula effect
  const nebula = useMemo(() => {
    const geometry = new THREE.SphereGeometry(60, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a0a2e,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(5, 10, -20);
    return mesh;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose stars
      stars1.geometry.dispose();
      (stars1.material as THREE.Material).dispose();
      stars2.geometry.dispose();
      (stars2.material as THREE.Material).dispose();
      // Dispose nebula
      nebula.geometry.dispose();
      (nebula.material as THREE.Material).dispose();
    };
  }, [stars1, stars2, nebula]);

  // Animate stars
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    frameCountRef.current++;

    if (stars1Ref.current) {
      stars1Ref.current.rotation.y = time * 0.02;
      stars1Ref.current.rotation.x = Math.sin(time * 0.01) * 0.1;
    }

    if (stars2Ref.current) {
      stars2Ref.current.rotation.y = time * 0.03;
      stars2Ref.current.rotation.x = Math.cos(time * 0.015) * 0.15;

      // Throttle twinkle updates to every N frames
      if (frameCountRef.current % TWINKLE_THROTTLE === 0) {
        const colors = stars2Ref.current.geometry.attributes.color.array as Float32Array;
        const baseColors = stars2Ref.current.geometry.attributes.baseColor.array as Float32Array;
        const twinkleOffsets = stars2Ref.current.geometry.attributes.twinkleOffset.array as Float32Array;

        // Batch update all star colors
        for (let i = 0; i < colors.length; i += 3) {
          const offset = twinkleOffsets[i / 3];
          // Use pre-calculated offset for more efficient twinkle
          const flicker = Math.sin(time * 2 + offset) * 0.1 + 0.9;

          // Apply flicker to base color
          colors[i] = baseColors[i] * flicker;
          colors[i + 1] = baseColors[i + 1] * flicker;
          colors[i + 2] = baseColors[i + 2] * flicker;
        }
        stars2Ref.current.geometry.attributes.color.needsUpdate = true;
      }
    }

    if (nebulaRef.current) {
      nebulaRef.current.rotation.y = time * 0.005;
      const mat = nebulaRef.current.material as THREE.Material;
      if ('opacity' in mat) {
        mat.opacity = 0.15 + Math.sin(time * 0.5) * 0.05;
      }
    }
  });

  return (
    <group>
      <primitive ref={stars1Ref} object={stars1} />
      <primitive ref={stars2Ref} object={stars2} />
      <primitive ref={nebulaRef} object={nebula} />
    </group>
  );
}
