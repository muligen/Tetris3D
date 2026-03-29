import { memo, useState } from 'react';

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotate: () => void;
  onHardDrop: () => void;
  onTogglePause: () => void;
}

export const TouchControls = memo(function TouchControls({
  onMoveLeft,
  onMoveRight,
  onRotate,
  onHardDrop,
  onTogglePause,
}: TouchControlsProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 10 && absY < 10) {
      onHardDrop();
    } else if (absX > absY) {
      if (deltaX > 30) onMoveRight();
      else if (deltaX < -30) onMoveLeft();
    } else {
      if (deltaY < -30) onRotate();
    }

    setTouchStart(null);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 md:hidden">
      <div
        className="flex justify-around items-center h-32 bg-black/30"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-opacity-40"
          onClick={onMoveLeft}
        >
          ←
        </button>
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-opacity-40"
          onClick={onRotate}
        >
          ↻
        </button>
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-opacity-40"
          onClick={onHardDrop}
        >
          ↓
        </button>
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-opacity-40"
          onClick={onMoveRight}
        >
          →
        </button>
      </div>
      <button
        className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded text-white active:bg-opacity-40"
        onClick={onTogglePause}
      >
        ⏸
      </button>
    </div>
  );
});
