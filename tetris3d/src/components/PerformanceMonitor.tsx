import { useRef, useState, useEffect, memo } from 'react';

/**
 * PerformanceMonitor - FPS 监控面板
 *
 * 轻量级 FPS 计数器，使用 requestAnimationFrame 而非 useFrame
 * 这样可以在 Canvas 外部的 DOM overlay 中使用
 * 快捷键: Ctrl+Shift+P 切换显示/隐藏
 */
export const PerformanceMonitor = memo(function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState({ current: 0, avg: 0, min: 0 });

  const frameHistory = useRef<number[]>([]);
  const lastTime = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const rafId = useRef<number>(0);

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

  // FPS 计算循环 - 使用原生 rAF，不依赖 R3F
  useEffect(() => {
    const tick = (now: number) => {
      rafId.current = requestAnimationFrame(tick);

      if (lastTime.current === 0) {
        lastTime.current = now;
        return;
      }

      const delta = now - lastTime.current;
      lastTime.current = now;

      const currentFps = delta > 0 ? 1000 / delta : 0;

      frameHistory.current.push(currentFps);
      if (frameHistory.current.length > 60) {
        frameHistory.current.shift();
      }

      if (now - lastUpdateTime.current > 250) {
        const history = frameHistory.current;
        const avg = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;
        const min = history.length > 0 ? Math.min(...history) : 0;

        setFps({ current: currentFps, avg, min });
        lastUpdateTime.current = now;
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  if (!isVisible) {
    return null;
  }

  const getColor = (value: number) => {
    if (value >= 50) return '#0f0';
    if (value >= 30) return '#ff0';
    return '#f00';
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
