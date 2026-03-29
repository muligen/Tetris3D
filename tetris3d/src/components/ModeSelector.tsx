/**
 * ModeSelector Component - Allows players to select game mode
 */

import { GameMode, getAllGameModes } from '../game/GameMode';

interface ModeSelectorProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  disabled?: boolean;
}

export function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  const modes = getAllGameModes();

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        Select Game Mode
      </h2>

      <div className="space-y-3">
        {modes.map((mode) => (
          <button
            key={mode.mode}
            onClick={() => onModeChange(mode.mode)}
            disabled={disabled}
            className={`
              w-full p-4 rounded-lg text-left transition-all
              ${
                currentMode === mode.mode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-opacity-20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-bold text-lg">{mode.name}</div>
                <div className="text-sm opacity-80 mt-1">
                  {mode.description}
                </div>
                <div className="flex gap-4 mt-2 text-xs opacity-70">
                  <span>
                    {mode.startLevel === 1
                      ? 'Start: Level 1'
                      : `Start: Level ${mode.startLevel}`}
                  </span>
                  {mode.timeLimit && (
                    <span>Time: {Math.floor(mode.timeLimit / 60)} min</span>
                  )}
                  {!mode.timeLimit && <span>Unlimited Time</span>}
                </div>
              </div>

              {currentMode === mode.mode && (
                <div className="ml-4">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-center text-white/60 text-sm">
        Press R to restart with selected mode
      </div>
    </div>
  );
}

/**
 * Mini mode selector for in-game mode switching
 */
interface MiniModeSelectorProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  disabled?: boolean;
}

export function MiniModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: MiniModeSelectorProps) {
  const modes = getAllGameModes();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {modes.map((mode) => (
        <button
          key={mode.mode}
          onClick={() => onModeChange(mode.mode)}
          disabled={disabled}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: '#ffffff',
            backgroundColor: currentMode === mode.mode ? '#a855f7' : 'rgba(255,255,255,0.2)',
            opacity: disabled ? 0.5 : 1,
          }}
          title={mode.description}
        >
          {mode.name}
        </button>
      ))}
    </div>
  );
}
