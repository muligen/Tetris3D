/**
 * 游戏配置集中管理
 *
 * 这个文件集中管理所有游戏配置，包括炸弹系统和游戏模式配置。
 */

import { GameMode, GameModeConfig, GAME_MODES } from './GameMode';

// 炸弹配置接口
export interface BombConfig {
  // Combo 奖励配置
  comboBombThreshold: number;      // 达到此 combo 数获得炸弹
  comboBombSlots: number;           // 每次奖励给当前方块的炸弹格子数

  // 随机炸弹配置
  randomBombChance: number;         // 方块生成时携带炸弹的概率 (0-1)
  maxBombsPerPiece: number;         // 单个方块最多炸弹数

  // 爆炸配置
  explosionRange: number;           // 爆炸半径：1=3x3, 2=5x5
  explosionDelay: number;           // 炸弹激活后的爆炸延迟 ms
  chainReactionEnabled: boolean;    // 是否允许连锁反应
  maxChainDepth: number;            // 最大连锁深度

  // 特效配置
  explosionParticles: boolean;      // 是否启用爆炸粒子特效
  explosionShakeIntensity: number;  // 爆炸屏幕震动强度 (0-1)

  // 其他配置
  bombRewardTarget: 'current' | 'next'; // combo 奖励炸弹添加到当前或下一个方块
  comboWindowMs: number;            // combo 窗口时间 ms
}

// 默认炸弹配置
export const DEFAULT_BOMB_CONFIG: BombConfig = {
  comboBombThreshold: 2,
  comboBombSlots: 1,
  randomBombChance: 0.1,
  maxBombsPerPiece: 1,
  explosionRange: 1,
  explosionDelay: 300,
  chainReactionEnabled: true,
  maxChainDepth: 10,
  explosionParticles: true,
  explosionShakeIntensity: 0.8,
  bombRewardTarget: 'current',
  comboWindowMs: 3000,
};

// 合并炸弹配置的辅助函数
export function mergeBombConfig(modeConfig?: Partial<BombConfig>): BombConfig {
  return { ...DEFAULT_BOMB_CONFIG, ...modeConfig };
}

// 获取指定模式的完整炸弹配置
export function getBombConfigForMode(mode: GameMode): BombConfig {
  const modeConfig = GAME_MODES[mode];
  return mergeBombConfig(modeConfig.bombConfig);
}

// 导出所有类型和配置
export type { GameModeConfig };
export { GameMode, GAME_MODES };
