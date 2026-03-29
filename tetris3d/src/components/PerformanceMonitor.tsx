import { useRef, useState, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * PerformanceMonitor - FPS 监控面板
 *
 * 轻量级 FPS 计数器，显示实时性能指标
 * - 使用 useFrame 获取精确的帧时间
 * - 维护最近 60 帧的历史
 * - HTML overlay，不影响 3D 渲染性能
 */
export const PerformanceMonitor = memo(function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState({ current: 0, avg: 0, min: 0 });

  // 使用 ref 存储帧历史，避免触发重新渲染
  const frameHistory = useRef<number[]>([]);
  const lastTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);

  // 快捷键切换显示/隐藏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // FPS 计算 - 使用 useFrame 获取精确时间
  useFrame(({ clock }) => {
    const now = clock.getElapsedTime() * 1000;

    // 跳过第一帧
    if (lastTime.current === 0) {
      lastTime.current = now;
      return;
    }

    const delta = now - lastTime.current;
    lastTime.current = now;

    // 计算 FPS
    const currentFps = delta > 0 ? 1000 / delta : 0;

    // 更新帧历史
    frameHistory.current.push(currentFps);
    if (frameHistory.current.length > 60) {
      frameHistory.current.shift();
    }

    // 每 250ms 更新一次显示（避免频繁更新）
    frameCount.current++;
    if (now - lastUpdateTime.current > 250) {
      const history = frameHistory.current;
      const avg = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;
      const min = history.length > 0 ? Math.min(...history) : 0;

      setFps({
        current: currentFps,
        avg,
        min,
      });

      lastUpdateTime.current = now;
      frameCount.current = 0;
    }
  });

  if (!isVisible) {
    return null;
  }

  // 根据 FPS 值选择颜色
  const getColor = (value: number) => {
    if (value >= 50) return '#0f0'; // 绿色 - 流畅
    if (value >= 30) return '#ff0'; // 黄色 - 可接受
    return '#f00'; // 红色 - 卡顿
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 4,
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 14,
        pointerEvents: 'none',
        zIndex: 20,
        userSelect: 'none',
        lineHeight: 1.5,
      }}
    >
      <div style={{ color: getColor(fps.current) }}>
        FPS: {fps.current.toFixed(1)}
      </div>
      <div style={{ color: getColor(fps.avg) }}>
        Avg: {fps.avg.toFixed(1)}
      </div>
      <div style={{ color: getColor(fps.min) }}>
        Min: {fps.min.toFixed(1)}
      </div>
    </div>
  );
});
