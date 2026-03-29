import { create } from 'zustand';
import { TetrisGame } from '../game/TetrisGame';
import { GameMode } from '../game/GameMode';
import { getHighScore, saveHighScore } from '../services/highScoreService';
import { getAudioService } from '../services/audioService';
import { addScore } from '../services/leaderboardService';
import { getGamepadService, GamepadAction } from '../services/gamepadService';
import { BOARD_HEIGHT, BLOCK_SIZE } from '../game/Board';

// Landing impact effect state
interface LandingImpactState {
  position: [number, number, number]; // World coordinates in Three.js space
  color: number;                       // Piece color
  progress: number;                    // Animation progress 0-1
  intensity: number;                   // Collision intensity (0-1, hardDrop=1, soft=0.3)
  cells: number[][];                   // Cells that just landed for deformation
}

// Line clear enhanced effect state
interface LineClearEnhancedState {
  rows: number[];
  rowColors: number[][];    // Color of each cell in cleared rows
  combo: number;            // Current combo count
  timestamp: number;        // When the effect was triggered
}

interface TetrisState {
  game: TetrisGame | null;
  version: number;
  highScore: number;
  currentMode: GameMode;
  soundEnabled: boolean;
  showLeaderboard: boolean;
  showModeSelector: boolean;
  remainingTime: number | undefined;
  clearedRows: number[];
  screenShakeIntensity: number;
  // Landing impact effect
  landingImpact: LandingImpactState | null;
  // Combo tracking
  comboCount: number;
  lastClearTime: number;
  // Enhanced line clear effects
  lineClearEnhanced: LineClearEnhancedState | null;
  // Combo flash effect
  comboFlashIntensity: number;
  init: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  rotate: () => void;
  hardDrop: () => void;
  togglePause: () => void;
  restart: () => void;
  update: (deltaTime: number) => void;
  triggerUpdate: () => void;
  updateHighScore: () => void;
  switchMode: (mode: GameMode) => void;
  toggleSound: () => void;
  toggleLeaderboard: () => void;
  toggleModeSelector: () => void;
  triggerLineClear: (rows: number[]) => void;
  clearLineClear: () => void;
  triggerScreenShake: (intensity: number) => void;
  updateScreenShake: (deltaTime: number) => number;
  // Landing impact methods
  triggerLandingImpact: (cells: number[][], color: number, isHardDrop: boolean) => void;
  updateLandingImpact: (deltaTime: number) => void;
  clearLandingImpact: () => void;
  // Combo methods
  triggerLineClearEnhanced: (rows: number[], rowColors: number[][]) => void;
  clearLineClearEnhanced: () => void;
  triggerComboFlash: (combo: number) => void;
  updateComboFlash: (deltaTime: number) => number;
}

export const useTetrisStore = create<TetrisState>((set, get) => {
  // Initialize services
  const gamepadService = getGamepadService();
  const audioService = getAudioService();

  // Setup gamepad action handler
  gamepadService.onAction((action: GamepadAction) => {
    const state = get();
    if (!state.game) return;

    switch (action) {
      case 'moveLeft':
        state.moveLeft();
        break;
      case 'moveRight':
        state.moveRight();
        break;
      case 'rotate':
        state.rotate();
        break;
      case 'hardDrop':
        state.hardDrop();
        break;
      case 'togglePause':
        state.togglePause();
        break;
    }
  });

  // Check for gamepads on initialization
  setTimeout(() => {
    gamepadService.checkForGamepads();
  }, 1000);

  return {
    game: null,
    version: 0,
    highScore: getHighScore(),
    currentMode: GameMode.CLASSIC,
    soundEnabled: true,
    showLeaderboard: false,
    showModeSelector: false,
    remainingTime: undefined,
    clearedRows: [],
    screenShakeIntensity: 0,
    // Landing impact
    landingImpact: null,
    // Combo tracking
    comboCount: 0,
    lastClearTime: 0,
    // Enhanced line clear
    lineClearEnhanced: null,
    // Combo flash
    comboFlashIntensity: 0,

    init: () => {
      const game = new TetrisGame(get().currentMode);

      // Setup callbacks
      game.setOnLinesCleared((lines: number, rows: number[], rowColors?: number[][]) => {
        audioService.playClear(lines);
        get().triggerLineClear(rows);

        // Update combo tracking
        const now = Date.now();
        const timeSinceLastClear = now - get().lastClearTime;
        let newCombo = get().comboCount;

        // Reset combo if more than 3 seconds since last clear
        if (timeSinceLastClear > 3000) {
          newCombo = 0;
        }
        newCombo++;

        // Trigger enhanced line clear with colors
        if (rowColors && rowColors.length > 0) {
          get().triggerLineClearEnhanced(rows, rowColors);
        }

        // Trigger combo flash for combos >= 2
        if (newCombo >= 2) {
          get().triggerComboFlash(newCombo);
        }

        // Calculate intensity based on lines and combo
        let baseIntensity = lines * 0.3;
        const comboMultiplier = Math.min(newCombo, 4);
        baseIntensity *= (1 + (comboMultiplier - 1) * 0.2);

        // Multi-line bonus
        if (lines === 4) {
          baseIntensity *= 3.0; // Tetris bonus
        } else if (lines === 3) {
          baseIntensity *= 2.0;
        } else if (lines === 2) {
          baseIntensity *= 1.5;
        }

        get().triggerScreenShake(Math.min(baseIntensity, 1.5));

        // Update state
        set({ comboCount: newCombo, lastClearTime: now });
      });

      game.setOnPiecePlaced((cells: number[][], color: number, isHardDrop: boolean) => {
        audioService.playDrop();
        get().triggerLandingImpact(cells, color, isHardDrop);
      });

      game.setOnGameOver(() => {
        audioService.playGameOver();
        const score = game.getScore();
        const isNewHighScore = saveHighScore(score);

        if (isNewHighScore) {
          set({ highScore: score });
        }

        // Add to leaderboard
        addScore(
          score,
          game.getLevel(),
          game.getLines(),
          game.getMode(),
          game.getElapsedTime()
        );
      });

      set({ game, version: 0, highScore: getHighScore() });
    },

    triggerUpdate: () => {
      set(state => ({ version: state.version + 1 }));
    },

    triggerLineClear: (rows: number[]) => {
      set({ clearedRows: rows });
    },

    clearLineClear: () => {
      set({ clearedRows: [] });
    },

    triggerScreenShake: (intensity: number) => {
      set({ screenShakeIntensity: intensity });
    },

    updateScreenShake: (deltaTime: number) => {
      const { screenShakeIntensity } = get();
      if (screenShakeIntensity <= 0) return 0;

      const decay = deltaTime * 5;
      const newIntensity = Math.max(0, screenShakeIntensity - decay);
      set({ screenShakeIntensity: newIntensity });

      return newIntensity;
    },

    // Trigger landing impact effect
    triggerLandingImpact: (cells: number[][], color: number, isHardDrop: boolean) => {
      if (cells.length === 0) return;

      // Calculate center position of the cells
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      cells.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });

      // Convert to Three.js world coordinates
      // X: center of cells range
      // Y: flip Y axis (game logic y=0 is top, Three.js Y is up)
      const centerX = (minX + maxX) / 2 * BLOCK_SIZE + BLOCK_SIZE / 2;
      const centerY = (BOARD_HEIGHT - 1 - (minY + maxY) / 2) * BLOCK_SIZE + BLOCK_SIZE / 2;
      const centerZ = BLOCK_SIZE * 0.25;

      const intensity = isHardDrop ? 1.0 : 0.3;

      set({
        landingImpact: {
          position: [centerX, centerY, centerZ],
          color,
          progress: 0,
          intensity,
          cells,
        },
      });

      // Trigger screen shake based on landing intensity
      if (isHardDrop) {
        get().triggerScreenShake(0.4);
      } else {
        get().triggerScreenShake(0.15);
      }
    },

    // Update landing impact (for progress tracking if needed)
    updateLandingImpact: (_deltaTime: number) => {
      // Landing impact is managed by the effect components
      // This method exists for potential future use
    },

    // Clear landing impact
    clearLandingImpact: () => {
      set({ landingImpact: null });
    },

    // Trigger enhanced line clear effect
    triggerLineClearEnhanced: (rows: number[], rowColors: number[][]) => {
      set({
        lineClearEnhanced: {
          rows,
          rowColors,
          combo: get().comboCount,
          timestamp: Date.now(),
        },
      });
    },

    clearLineClearEnhanced: () => {
      set({ lineClearEnhanced: null });
    },

    // Trigger combo flash effect
    triggerComboFlash: (combo: number) => {
      const intensity = Math.min(combo * 0.15, 0.6);
      set({ comboFlashIntensity: intensity });
    },

    updateComboFlash: (deltaTime: number) => {
      const { comboFlashIntensity } = get();
      if (comboFlashIntensity <= 0) return 0;

      const decay = deltaTime * 3;
      const newIntensity = Math.max(0, comboFlashIntensity - decay);
      set({ comboFlashIntensity: newIntensity });

      return newIntensity;
    },

    moveLeft: () => {
      const { game } = get();
      if (game) {
        game.moveLeft();
        get().triggerUpdate();
      }
    },

    moveRight: () => {
      const { game } = get();
      if (game) {
        game.moveRight();
        get().triggerUpdate();
      }
    },

    rotate: () => {
      const { game } = get();
      if (game) {
        game.rotate();
        get().triggerUpdate();
      }
    },

    hardDrop: () => {
      const { game } = get();
      if (game) {
        game.hardDrop();
        get().triggerUpdate();
      }
    },

    togglePause: () => {
      const { game } = get();
      if (game) {
        game.togglePause();
        get().triggerUpdate();
      }
    },

    restart: () => {
      const { game } = get();
      if (game) {
        game.restart();
        // Reset combo and effects on restart
        set({
          comboCount: 0,
          lastClearTime: 0,
          landingImpact: null,
          lineClearEnhanced: null,
          comboFlashIntensity: 0,
          clearedRows: [],
        });
        get().triggerUpdate();
      }
    },

    update: (deltaTime: number) => {
      const { game } = get();
      if (game) {
        const oldState = game.getState();
        game.update(deltaTime);
        // 不再无条件触发重新渲染 - 3D 场景由 useFrame 直接驱动
        // 只在游戏状态真正变化时触发
        if (game.getState() !== oldState) {
          if (game.getState() === 'gameover') {
            get().updateHighScore();
          }
          // 状态变化时触发 version 更新，确保 UI 同步
          get().triggerUpdate();
        }

        // Update combo flash decay
        get().updateComboFlash(deltaTime);

        // Check for combo timeout (3 seconds)
        const now = Date.now();
        const lastClear = get().lastClearTime;
        if (lastClear > 0 && now - lastClear > 3000) {
          set({ comboCount: 0 });
        }
      }
    },

    updateHighScore: () => {
      const { game } = get();
      if (game) {
        const score = game.getScore();
        const isNewHighScore = saveHighScore(score);
        if (isNewHighScore) {
          set({ highScore: score });
        }
      }
    },

    switchMode: (mode: GameMode) => {
      const { game } = get();
      if (game) {
        game.switchMode(mode);
        set({ currentMode: mode });
        get().triggerUpdate();
      }
    },

    toggleSound: () => {
      const newState = !get().soundEnabled;
      audioService.setEnabled(newState);
      set({ soundEnabled: newState });
    },

    toggleLeaderboard: () => {
      set((state) => ({ showLeaderboard: !state.showLeaderboard }));
    },

    toggleModeSelector: () => {
      set((state) => ({ showModeSelector: !state.showModeSelector }));
    },
  };
});
