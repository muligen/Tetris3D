import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PieceType, PIECE_COLORS, PIECE_SHAPES } from '../game/shapes';
import { BLOCK_SIZE } from '../game/Board';

interface NextPiecePreviewProps {
  pieceType: PieceType | null;
}

export function NextPiecePreview({ pieceType }: NextPiecePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pieceGroupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      50,
      1, // 正方形视口
      0.1,
      1000
    );
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(100, 100);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }
    rendererRef.current = renderer;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 5, 3);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(-2, 3, 2);
    scene.add(pointLight);

    // 创建方块组（用于旋转）
    const pieceGroup = new THREE.Group();
    scene.add(pieceGroup);
    pieceGroupRef.current = pieceGroup;

    // 动画循环
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // 缓慢旋转方块
      if (pieceGroup) {
        pieceGroup.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 清理
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 更新方块
  useEffect(() => {
    if (!pieceGroupRef.current || !pieceType) return;

    const pieceGroup = pieceGroupRef.current;

    // 清除旧的方块
    while (pieceGroup.children.length > 0) {
      const child = pieceGroup.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      pieceGroup.remove(child);
    }

    // 创建新的方块
    const shape = PIECE_SHAPES[pieceType];
    const color = PIECE_COLORS[pieceType];
    const geometry = new THREE.BoxGeometry(
      BLOCK_SIZE * 0.9,
      BLOCK_SIZE * 0.9,
      BLOCK_SIZE * 0.4
    );

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.6,
      emissive: color,
      emissiveIntensity: 0.3,
    });

    // 计算中心点以居中显示
    const centerX = shape.reduce((sum, [x]) => sum + x, 0) / shape.length;
    const centerY = shape.reduce((sum, [, y]) => sum + y, 0) / shape.length;

    shape.forEach(([x, y]) => {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (x - centerX) * BLOCK_SIZE,
        (y - centerY) * BLOCK_SIZE,
        0
      );
      pieceGroup.add(cube);
    });

    // 重置旋转
    pieceGroup.rotation.y = 0;
  }, [pieceType]);

  return (
    <div
      ref={containerRef}
      style={{ width: 100, height: 100, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    />
  );
}
