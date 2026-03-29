/**
 * Game Mode definitions and configurations
 */

export enum GameMode {
  CLASSIC = 'classic',
  CHALLENGE = 'challenge',
  MARATHON = 'marathon'
}

export interface GameModeConfig {
  mode: GameMode;
  name: string;
  description: string;
  timeLimit?: number; // seconds, undefined = unlimited
  startLevel: number;
  levelInterval: number; // lines per level increase
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  [GameMode.CLASSIC]: {
    mode: GameMode.CLASSIC,
    name: 'Classic',
    description: 'Classic Tetris gameplay. Take your time, plan ahead, and aim for the high score!',
    timeLimit: undefined,
    startLevel: 1,
    levelInterval: 10,
  },
  [GameMode.CHALLENGE]: {
    mode: GameMode.CHALLENGE,
    name: 'Challenge',
    description: 'Race against the clock! 3 minutes to score as much as possible. Starts at level 5.',
    timeLimit: 180, // 3 minutes
    startLevel: 5,
    levelInterval: 5,
  },
  [GameMode.MARATHON]: {
    mode: GameMode.MARATHON,
    name: 'Marathon',
    description: 'Endless mode with no time limit. How far can you go?',
    timeLimit: undefined,
    startLevel: 1,
    levelInterval: 15,
  },
};

export function getGameModeConfig(mode: GameMode): GameModeConfig {
  return GAME_MODES[mode];
}

export function getAllGameModes(): GameModeConfig[] {
  return Object.values(GAME_MODES);
}
