import { memo } from 'react';
import { NextPiecePreview } from './NextPiecePreview';
import { PieceType } from '../game/shapes';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  level: number;
  lines: number;
  nextPieceType: PieceType | null;
  remainingTime?: number;
}

export const ScoreBoard = memo(function ScoreBoard({ score, highScore, level, lines, nextPieceType, remainingTime }: ScoreBoardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'absolute', top: 8, right: 8, pointerEvents: 'auto', color: '#fff', fontFamily: 'monospace' }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: 10, border: '1px solid rgba(255,255,255,0.2)', minWidth: 110 }}>
        {/* 分数区域 - 紧凑网格布局 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, marginBottom: 6 }}>
          <div style={{ color: '#ff9800' }}>SCR:{score}</div>
          <div style={{ color: '#ffc107' }}>HI:{highScore}</div>
          <div style={{ color: '#4caf50' }}>LV:{level}</div>
          <div style={{ color: '#42a5f5' }}>LN:{lines}</div>
        </div>

        {/* 剩余时间（限时模式） */}
        {remainingTime !== undefined && (
          <div style={{ backgroundColor: 'rgba(244,67,54,0.3)', borderRadius: 6, padding: '4px 8px', textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: '#ef9a9a' }}>TIME</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: remainingTime <= 30 ? '#f44336' : '#ef5350' }}>
              {formatTime(remainingTime)}
            </div>
          </div>
        )}

        {/* 下一个方块预览 - 小尺寸 */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, marginTop: 6 }}>
          <div style={{ fontSize: 11, color: '#e0e0e0', marginBottom: 4, textAlign: 'center' }}>NEXT</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <NextPiecePreview pieceType={nextPieceType} />
          </div>
        </div>
      </div>
    </div>
  );
});
