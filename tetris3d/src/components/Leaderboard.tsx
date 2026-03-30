/**
 * Leaderboard Component - Displays high scores for each game mode
 */

import { useState, useEffect, useCallback } from 'react';
import {
  GameMode,
  getAllGameModes,
} from '../game/GameMode';
import {
  LeaderboardEntry,
  getLeaderboard,
  formatLeaderboardDate,
} from '../services/leaderboardService';

interface LeaderboardProps {
  onClose?: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CLASSIC);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const modes = getAllGameModes();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const modeEntries = await getLeaderboard(selectedMode);
      setEntries(modeEntries);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, [selectedMode]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const selectedModeConfig = modes.find((m) => m.mode === selectedMode);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden border-2 border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {modes.map((mode) => (
            <button
              key={mode.mode}
              onClick={() => setSelectedMode(mode.mode)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${
                  selectedMode === mode.mode
                    ? 'bg-white text-purple-900 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-opacity-30'
                }
              `}
            >
              {mode.name}
            </button>
          ))}
        </div>

        {/* Leaderboard content */}
        <div className="bg-black/30 rounded-lg p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center text-white/60 py-12">
              <p className="text-lg">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center text-white/60 py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-lg">No scores yet for {selectedModeConfig?.name} mode!</p>
              <p className="text-sm mt-2">Be the first to set a record!</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-white/60 text-left border-b border-white/20">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Score</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">Level</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">Lines</th>
                  <th className="pb-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={index}
                    className={`
                      text-white border-b border-white border-opacity-10
                      ${index === 0 ? 'bg-yellow-500 bg-opacity-20' : ''}
                      ${index === 1 ? 'bg-gray-400 bg-opacity-20' : ''}
                      ${index === 2 ? 'bg-orange-400 bg-opacity-20' : ''}
                    `}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 && (
                          <span className="text-xl">
                            {entry.rank === 1 && '\u{1F947}'}
                            {entry.rank === 2 && '\u{1F948}'}
                            {entry.rank === 3 && '\u{1F949}'}
                          </span>
                        )}
                        <span className="font-bold">{entry.rank}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {entry.name}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-lg font-bold">
                        {entry.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {entry.level}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {entry.lines}
                    </td>
                    <td className="py-3 text-sm text-white text-opacity-70 hidden md:table-cell">
                      {formatLeaderboardDate(entry.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="mt-4 text-center text-white/60 text-sm">
            Press L to toggle leaderboard
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini leaderboard display for in-game
 */
interface MiniLeaderboardProps {
  mode: GameMode;
  showBestOnly?: boolean;
}

export function MiniLeaderboard({
  mode,
  showBestOnly = false,
}: MiniLeaderboardProps) {
  const [bestScore, setBestScore] = useState<number>(0);
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboard(mode).then((entries) => {
      if (entries.length > 0) {
        setBestScore(entries[0].score);
        if (!showBestOnly) {
          setTopScores(entries.slice(0, 3));
        }
      }
    }).catch(() => {});
  }, [mode, showBestOnly]);

  if (showBestOnly) {
    return (
      <div className="text-white text-opacity-80 text-sm">
        Best: <span className="font-mono font-bold">{bestScore.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {topScores.map((entry) => (
        <div
          key={entry.rank}
          className="flex items-center gap-2 text-white text-opacity-80 text-xs"
        >
          <span>{entry.rank}.</span>
          <span className="truncate max-w-[60px]">{entry.name}</span>
          <span className="font-mono">{entry.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
