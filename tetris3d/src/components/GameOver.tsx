import { GameMode } from '../game/GameMode';
import { useTetrisStore } from '../stores/tetrisStore';

interface GameOverProps {
  score: number;
  level: number;
  lines: number;
  mode: GameMode;
  onRestart: () => void;
}

export function GameOver({ score, level, lines, mode, onRestart }: GameOverProps) {
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

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              useTetrisStore.getState().toggleLeaderboard();
            }}
            className="px-6 py-3 bg-white/20 text-white text-lg font-bold rounded-xl hover:bg-opacity-30 transition-all"
          >
            🏆 Leaderboard
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
}
