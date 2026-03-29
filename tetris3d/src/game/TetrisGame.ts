import { Piece } from './Piece.ts';
import { Board } from './Board.ts';
import { randomPieceType, PieceType } from './shapes.ts';
import { GameMode, GameModeConfig, GAME_MODES, BombConfig, mergeBombConfig } from './GameMode';

export type GameState = 'playing' | 'paused' | 'gameover';

export interface ExplosionEvent {
  centers: Array<[x: number, y: number]>;
  affectedCells: Array<[x: number, y: number]>;
  depth: number;
}

// 待处理的爆炸
interface PendingExplosion {
  bombPositions: Array<[x: number, y: number]>;
  delay: number; // 剩余延迟时间 ms
}

export class TetrisGame {
  private board: Board;
  private currentPiece: Piece | null = null;
  private nextPieceType: PieceType | null = null;
  private score: number = 0;
  private level: number = 1;
  private lines: number = 0;
  private state: GameState = 'playing';
  private dropInterval: number = 1000; // 毫秒
  private lastDropTime: number = 0;
  private modeConfig: GameModeConfig;
  private bombConfig: BombConfig;
  private elapsedTime: number = 0; // For timed modes
  private onLinesCleared: ((lines: number, rows: number[], rowColors?: number[][]) => void) | null = null;
  private onPiecePlaced: ((cells: number[][], color: number, isHardDrop: boolean) => void) | null = null;
  private onGameOver: (() => void) | null = null;
  private onBombExplosion: ((event: ExplosionEvent) => void) | null = null;
  private wasHardDrop: boolean = false;
  private pendingBombRewards: number = 0; // 待发放的炸弹奖励（给下一个方块）
  private pendingExplosion: PendingExplosion | null = null; // 待处理的爆炸（延迟1秒）
  private onBombCountdown: ((positions: Array<[x: number, y: number]>, remaining: number) => void) | null = null;

  constructor(mode: GameMode = GameMode.CLASSIC) {
    this.board = new Board();
    this.modeConfig = GAME_MODES[mode];
    this.bombConfig = mergeBombConfig(this.modeConfig.bombConfig);
    this.level = this.modeConfig.startLevel;
    this.dropInterval = this.calculateDropInterval(this.level);
    this.nextPieceType = randomPieceType();
    this.spawnNewPiece();
  }

  // Calculate drop interval based on level
  private calculateDropInterval(level: number): number {
    return Math.max(50, 1000 - (level - 1) * 100);
  }

  // Set callbacks
  setOnLinesCleared(callback: (lines: number, rows: number[], rowColors?: number[][]) => void): void {
    this.onLinesCleared = callback;
  }

  setOnPiecePlaced(callback: (cells: number[][], color: number, isHardDrop: boolean) => void): void {
    this.onPiecePlaced = callback;
  }

  setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }

  setOnBombExplosion(callback: (event: ExplosionEvent) => void): void {
    this.onBombExplosion = callback;
  }

  setOnBombCountdown(callback: (positions: Array<[x: number, y: number]>, remaining: number) => void): void {
    this.onBombCountdown = callback;
  }

  // Get current game mode
  getMode(): GameMode {
    return this.modeConfig.mode;
  }

  // Get mode config
  getModeConfig(): GameModeConfig {
    return this.modeConfig;
  }

  // Get bomb config
  getBombConfig(): BombConfig {
    return this.bombConfig;
  }

  // Get elapsed time (for timed modes)
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  // Get remaining time (for timed modes, in seconds)
  getRemainingTime(): number | undefined {
    if (this.modeConfig.timeLimit) {
      return Math.max(0, this.modeConfig.timeLimit - Math.floor(this.elapsedTime / 1000));
    }
    return undefined;
  }

  // Check if time is up (for timed modes)
  isTimeUp(): boolean {
    if (this.modeConfig.timeLimit) {
      return this.elapsedTime >= this.modeConfig.timeLimit * 1000;
    }
    return false;
  }

  // 生成新方块
  private spawnNewPiece(): void {
    this.currentPiece = new Piece(this.nextPieceType || undefined);
    this.nextPieceType = randomPieceType();

    // 应用 combo 奖励的待发放炸弹
    if (this.pendingBombRewards > 0) {
      const cells = this.currentPiece.getCells();
      for (let s = 0; s < this.pendingBombRewards; s++) {
        if (this.currentPiece.getBombCount() >= this.bombConfig.maxBombsPerPiece) break;
        const availableIndices = cells.map((_, i) => i).filter(i => !this.currentPiece!.hasBombAt(i));
        if (availableIndices.length === 0) break;
        const idx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        this.currentPiece.addBomb(idx);
      }
      this.pendingBombRewards = 0;
    }

    // 检查游戏是否结束
    if (!this.isValidPosition()) {
      this.state = 'gameover';
      if (this.onGameOver) this.onGameOver();
    }
  }

  // Combo 奖励：记录待发放的炸弹（下次生成方块时应用）
  grantBombReward(combo: number): boolean {
    if (combo < this.bombConfig.comboBombThreshold) return false;
    this.pendingBombRewards += this.bombConfig.comboBombSlots;
    return true;
  }

  // 检查当前位置是否有效
  private isValidPosition(): boolean {
    if (!this.currentPiece) return false;
    const cells = this.currentPiece.getCells();
    return cells.every(([x, y]) => {
      if (x < 0 || x >= 10 || y < 0 || y >= 20) return false;
      const grid = this.board.getGrid();
      return grid[y][x] === null;
    });
  }

  // 更新游戏（游戏循环）
  update(deltaTime: number): void {
    if (this.state !== 'playing') return;

    // Update elapsed time
    this.elapsedTime += deltaTime;

    // Check if time is up for timed modes
    if (this.isTimeUp()) {
      this.state = 'gameover';
      if (this.onGameOver) this.onGameOver();
      return;
    }

    // 处理待爆炸的炸弹（延迟倒计时）
    if (this.pendingExplosion) {
      this.pendingExplosion.delay -= deltaTime;
      // 通知 UI 更新倒计时
      if (this.onBombCountdown) {
        this.onBombCountdown(this.pendingExplosion.bombPositions, Math.max(0, this.pendingExplosion.delay));
      }
      if (this.pendingExplosion.delay <= 0) {
        const bombs = this.pendingExplosion.bombPositions;
        this.pendingExplosion = null;
        // 执行爆炸
        this.executeChainExplosion(bombs, 0);
        this.postExplosionCheckLines();
        // 爆炸完成后生成新方块
        this.spawnNewPiece();
      }
      return; // 爆炸等待期间不处理下落
    }

    this.lastDropTime += deltaTime;

    if (this.lastDropTime >= this.dropInterval) {
      this.lastDropTime = 0;
      this.drop();
    }
  }

  // 方块下落
  private drop(): void {
    if (!this.currentPiece) return;

    // 标记为非硬降
    this.wasHardDrop = false;

    // 尝试下落
    this.currentPiece.moveDown();

    // 检查位置是否有效
    if (!this.isValidPosition()) {
      // 无效，回退并放置
      this.currentPiece.moveUp(); // 回退
      this.placePiece();
    }
  }

  // 快速下落
  hardDrop(): void {
    if (!this.currentPiece) return;

    // 标记为硬降
    this.wasHardDrop = true;

    while (true) {
      this.currentPiece.moveDown();
      if (!this.isValidPosition()) {
        this.currentPiece.moveUp(); // 回退到有效位置
        this.placePiece();
        break;
      }
    }
  }

  // 放置方块
  private placePiece(): void {
    if (!this.currentPiece) return;

    const cells = this.currentPiece.getCells();
    const color = this.currentPiece.getColor();
    const bombIndices = this.currentPiece.getBombCellIndices();

    // 检查是否在有效位置
    if (cells.some(([x, y]) => x < 0 || x >= 10 || y < 0 || y >= 20)) {
      this.state = 'gameover';
      if (this.onGameOver) this.onGameOver();
      return;
    }

    // 放置方块（含炸弹信息）
    if (bombIndices.length > 0) {
      this.board.placePieceWithBombs(cells, color, bombIndices, 'random');
    } else {
      this.board.placePiece(cells, color);
    }

    // Trigger piece placed callback with landing info
    if (this.onPiecePlaced) {
      this.onPiecePlaced(cells, color, this.wasHardDrop);
    }
    // Reset hard drop flag after using it
    this.wasHardDrop = false;

    // 检查并清除满行
    const result = this.board.checkLines();

    if (result.linesCleared > 0) {
      this.addScore(result.linesCleared);

      // Pass row colors to callback
      if (this.onLinesCleared) {
        this.onLinesCleared(result.linesCleared, result.clearedRows, result.clearedRowColors);
      }

      // 处理炸弹爆炸：如果有炸弹，延迟1秒再爆炸
      if (result.bombPositions.length > 0) {
        this.pendingExplosion = {
          bombPositions: result.bombPositions,
          delay: this.bombConfig.explosionDelay,
        };
        // 通知 UI 显示倒计时
        if (this.onBombCountdown) {
          this.onBombCountdown(result.bombPositions, this.bombConfig.explosionDelay);
        }
        // 不立即生成新方块，等爆炸完成后再生成
        return;
      }
    }

    // 生成新方块
    this.spawnNewPiece();
  }

  // 执行连锁爆炸
  private executeChainExplosion(
    bombPositions: Array<[x: number, y: number]>,
    depth: number
  ): void {
    if (depth >= this.bombConfig.maxChainDepth) return;
    if (bombPositions.length === 0) return;

    // 计算爆炸范围
    const { affectedCells, chainBombs } = this.board.detonateAt(
      bombPositions,
      this.bombConfig.explosionRange
    );

    if (affectedCells.length === 0) return;

    // 触发爆炸回调（通知渲染层）
    if (this.onBombExplosion) {
      this.onBombExplosion({
        centers: bombPositions,
        affectedCells,
        depth,
      });
    }

    // 移除受影响的格子并应用重力
    this.board.removeCellsAndApplyGravity(affectedCells);

    // 爆炸计分
    const explosionScore = affectedCells.length * 50 * (depth + 1);
    this.score += explosionScore;

    // 连锁反应
    if (chainBombs.length > 0 && this.bombConfig.chainReactionEnabled) {
      this.executeChainExplosion(chainBombs, depth + 1);
    }
  }

  // 爆炸后重新检查满行
  private postExplosionCheckLines(): void {
    const result = this.board.checkLines();
    if (result.linesCleared > 0) {
      this.addScore(result.linesCleared);
      // 检查新消除的行中是否有更多炸弹
      const bombPositions = this.board.getBombPositionsInRows(result.clearedRows);
      if (this.onLinesCleared) {
        this.onLinesCleared(result.linesCleared, result.clearedRows, result.clearedRowColors);
      }
      if (bombPositions.length > 0) {
        this.executeChainExplosion(bombPositions, 0);
        this.postExplosionCheckLines();
      }
    }
  }

  // 移动左
  moveLeft(): void {
    if (this.state !== 'playing' || !this.currentPiece) return;

    this.currentPiece.moveLeft();
    if (!this.isValidPosition()) {
      this.currentPiece.moveRight(); // 回退
    }
  }

  // 移动右
  moveRight(): void {
    if (this.state !== 'playing' || !this.currentPiece) return;

    this.currentPiece.moveRight();
    if (!this.isValidPosition()) {
      this.currentPiece.moveLeft(); // 回退
    }
  }

  // 旋转
  rotate(): void {
    if (this.state !== 'playing' || !this.currentPiece) return;

    const oldRotation = this.currentPiece.getRotation();
    this.currentPiece.rotate();
    if (!this.isValidPosition()) {
      this.currentPiece.setRotation(oldRotation); // 回退
    }
  }

  // 添加分数
  private addScore(lines: number): void {
    const baseScore = lines * 100;
    const bonus = lines > 1 ? lines * 50 : 0;
    this.score += baseScore + bonus;
    this.lines += lines;

    // Level up based on mode configuration
    const newLevel = Math.floor(this.lines / this.modeConfig.levelInterval) + this.modeConfig.startLevel;
    if (newLevel > this.level) {
      this.level = newLevel;
      // Increase speed
      this.dropInterval = this.calculateDropInterval(this.level);
    }
  }

  // 获取游戏板
  getBoard(): Board {
    return this.board;
  }

  // 获取当前方块
  getCurrentPiece(): Piece | null {
    return this.currentPiece;
  }

  // 获取分数
  getScore(): number {
    return this.score;
  }

  // 获取等级
  getLevel(): number {
    return this.level;
  }

  // 获取消除行数
  getLines(): number {
    return this.lines;
  }

  // 获取游戏状态
  getState(): GameState {
    return this.state;
  }

  // 暂停/继续
  togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  // 重新开始
  restart(): void {
    this.board = new Board();
    this.score = 0;
    this.level = this.modeConfig.startLevel;
    this.lines = 0;
    this.state = 'playing';
    this.dropInterval = this.calculateDropInterval(this.level);
    this.lastDropTime = 0;
    this.elapsedTime = 0;
    this.nextPieceType = randomPieceType();
    this.spawnNewPiece();
  }

  // Switch to a different mode
  switchMode(mode: GameMode): void {
    this.modeConfig = GAME_MODES[mode];
    this.bombConfig = mergeBombConfig(this.modeConfig.bombConfig);
    this.level = this.modeConfig.startLevel;
    this.dropInterval = this.calculateDropInterval(this.level);
    this.restart();
  }

  // 获取下一个方块类型
  getNextPieceType(): PieceType | null {
    return this.nextPieceType;
  }

  // 检查游戏是否结束
  isGameOver(): boolean {
    return this.state === 'gameover';
  }

  // 获取 Ghost Piece 的单元格位置（硬降后的落点）
  getGhostCells(): number[][] {
    if (!this.currentPiece) return [];

    // 克隆方块
    const ghost = this.currentPiece.clone();

    // 向下移动直到无效
    while (true) {
      ghost.moveDown();
      const cells = ghost.getCells();
      if (!this.isValidPositionForCells(cells)) {
        ghost.moveUp(); // 回退到最后有效位置
        break;
      }
    }

    return ghost.getCells();
  }

  // 检查给定单元格位置是否有效
  private isValidPositionForCells(cells: number[][]): boolean {
    return cells.every(([x, y]) => {
      if (x < 0 || x >= 10 || y < 0 || y >= 20) return false;
      const grid = this.board.getGrid();
      return grid[y][x] === null;
    });
  }
}
