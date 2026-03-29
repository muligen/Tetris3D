import { memo } from 'react';

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
  return (
    <div className="absolute bottom-0 left-0 right-0 md:hidden" style={{ pointerEvents: 'auto' }}>
      <div className="flex justify-around items-center h-32 bg-black/30">
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-white/40 touch-manipulation select-none"
          onTouchStart={(e) => { e.preventDefault(); onMoveLeft(); }}
        >
          ←
        </button>
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-white/40 touch-manipulation select-none"
          onTouchStart={(e) => { e.preventDefault(); onRotate(); }}
        >
          ↻
        </button>
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-white/40 touch-manipulation select-none"
          onTouchStart={(e) => { e.preventDefault(); onHardDrop(); }}
        >
          ↓
        </button>
        <button
          className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl active:bg-white/40 touch-manipulation select-none"
          onTouchStart={(e) => { e.preventDefault(); onMoveRight(); }}
        >
          →
        </button>
      </div>
      <button
        className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded text-white active:bg-white/40 touch-manipulation select-none"
        onTouchStart={(e) => { e.preventDefault(); onTogglePause(); }}
      >
        ⏸
      </button>
    </div>
  );
});
