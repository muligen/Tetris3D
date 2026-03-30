import { memo, useState, useRef, useEffect } from 'react';
import { GameMode } from '../game/GameMode';
import { useTetrisStore } from '../stores/tetrisStore';

interface GameOverProps {
  score: number;
  level: number;
  lines: number;
  mode: GameMode;
  onRestart: () => void;
}

export const GameOver = memo(function GameOver({ score, level, lines, mode, onRestart }: GameOverProps) {
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getModeName = (mode: GameMode): string => {
    switch (mode) {
      case GameMode.CLASSIC:
        return 'Classic';
      case GameMode.CHALLENGE:
        return 'Challenge';
      case GameMode.MARATHON:
        return 'Marathon';
    }
  };

  const handleSubmit = async () => {
    const name = playerName.trim() || 'Anonymous';
    setSubmitting(true);
    try {
      await useTetrisStore.getState().submitScore(name);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && !submitting) {
      handleSubmit();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-12 text-center border-2 border-purple-500 shadow-2xl max-w-md">
        <h1 className="text-5xl font-bold text-white mb-4 animate-bounce">
          GAME OVER
        </h1>

        <div className="text-lg text-purple-300 mb-6">
          {getModeName(mode)} Mode
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-xl text-purple-200">
            <span>Final Score:</span>
            <span className="font-bold text-white">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl text-purple-200">
            <span>Level Reached:</span>
            <span className="font-bold text-white">{level}</span>
          </div>
          <div className="flex justify-between text-xl text-purple-200">
            <span>Total Lines:</span>
            <span className="font-bold text-white">{lines}</span>
          </div>
        </div>

        {/* Name input section */}
        {!submitted ? (
          <div className="mb-6">
            <label className="block text-purple-300 text-sm mb-2">Enter your name for the leaderboard:</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Anonymous"
                maxLength={20}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
              >
                {submitting ? '...' : 'Submit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-green-400 text-sm">
            Score submitted!
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              useTetrisStore.getState().toggleLeaderboard();
            }}
            className="px-6 py-3 bg-white/20 text-white text-lg font-bold rounded-xl hover:bg-opacity-30 transition-all"
          >
            Leaderboard
          </button>
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
          >
            PLAY AGAIN
          </button>
        </div>

        <div className="mt-6 text-purple-300 text-sm space-y-1">
          <div>Press R to restart</div>
          <div>Press L for leaderboard</div>
          <div>Press M to change mode</div>
        </div>
      </div>
    </div>
  );
});
