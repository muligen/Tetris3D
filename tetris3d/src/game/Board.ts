// 游戏板配置
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BLOCK_SIZE = 1;

// 炸弹元数据
export interface BombMetadata {
  type: 'combo' | 'random';  // 炸弹来源
  armed: boolean;            // 是否已激活
}

// 单元格数据（包含颜色和可选的炸弹信息）
export interface CellData {
  color: number;       // 方块颜色
  bomb?: BombMetadata; // 可选的炸弹信息
}

// 单元格状态：null 表示空，CellData 表示有方块
export type Cell = CellData | null;

// 游戏板类
export class Board {
  private grid: Cell[][];
  private width: number;
  private height: number;

  constructor(width: number = BOARD_WIDTH, height: number = BOARD_HEIGHT) {
    this.width = width;
    this.height = height;
    this.grid = Array(height).fill(null).map(() => Array(width).fill(null));
  }

  // 检查位置是否有效
  isValidPosition(cells: number[][]): boolean {
    for (const [x, y] of cells) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        return false;
      }
      if (this.grid[y][x] !== null) {
        return false;
      }
    }
    return true;
  }

  // 放置方块
  placePiece(cells: number[][], color: number): void {
    for (const [x, y] of cells) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.grid[y][x] = { color };
      }
    }
  }

  // 放置带炸弹的方块
  placePieceWithBombs(
    cells: number[][],
    color: number,
    bombCells: number[],
    bombType: 'combo' | 'random'
  ): void {
    for (let i = 0; i < cells.length; i++) {
      const [x, y] = cells[i];
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const hasBomb = bombCells.includes(i);
        this.grid[y][x] = hasBomb
          ? { color, bomb: { type: bombType, armed: false } }
          : { color };
      }
    }
  }

  // 获取网格
  getGrid(): Cell[][] {
    return this.grid;
  }

  // 检查并清除满行，返回清除的行数、行号、每行的颜色和炸弹位置
  checkLines(): { linesCleared: number; clearedRows: number[]; clearedRowColors: number[][]; bombPositions: Array<[x: number, y: number]> } {
    let linesCleared = 0;
    const clearedRows: number[] = [];
    const clearedRowColors: number[][] = [];
    const bombPositions: Array<[x: number, y: number]> = [];

    for (let y = this.height - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== null)) {
        // Capture row colors before clearing
        const rowColors = this.grid[y].map(cell => (cell as CellData).color);
        clearedRowColors.push(rowColors);

        // 在删除行之前捕获炸弹位置
        for (let x = 0; x < this.width; x++) {
          const cell = this.grid[y][x];
          if (cell !== null && cell.bomb && !cell.bomb.armed) {
            bombPositions.push([x, y]);
          }
        }

        // 移除这一行
        this.grid.splice(y, 1);
        // 在顶部添加新行
        this.grid.unshift(Array(this.width).fill(null));
        clearedRows.push(y);
        linesCleared++;
        y++; // 重新检查这一行
      }
    }

    return { linesCleared, clearedRows, clearedRowColors, bombPositions };
  }

  // 检查游戏是否结束
  isGameOver(): boolean {
    // 检查顶行是否有方块
    return this.grid[0].some(cell => cell !== null);
  }

  // 克隆游戏板
  clone(): Board {
    const newBoard = new Board(this.width, this.height);
    newBoard.grid = this.grid.map(row =>
      row.map(cell => cell === null ? null : { ...cell })
    );
    return newBoard;
  }

  // 获取占用状态（向后兼容，只返回颜色）
  getOccupiedCells(): Array<[x: number, y: number, color: number]> {
    const occupied: Array<[x: number, y: number, color: number]> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell !== null) {
          occupied.push([x, y, cell.color]);
        }
      }
    }
    return occupied;
  }

  // 获取占用状态（包含完整 CellData，用于炸弹系统）
  getOccupiedCellsWithData(): Array<[x: number, y: number, cell: CellData]> {
    const occupied: Array<[x: number, y: number, cell: CellData]> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell !== null) {
          occupied.push([x, y, cell]);
        }
      }
    }
    return occupied;
  }

  // 获取指定行中的炸弹位置
  getBombPositionsInRows(rows: number[]): Array<[x: number, y: number]> {
    const positions: Array<[x: number, y: number]> = [];
    for (const y of rows) {
      if (y < 0 || y >= this.height) continue;
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell !== null && cell.bomb && !cell.bomb.armed) {
          positions.push([x, y]);
        }
      }
    }
    return positions;
  }

  // 在指定位置执行爆炸，返回受影响的格子和新发现的炸弹
  detonateAt(
    positions: Array<[x: number, y: number]>,
    range: number
  ): { affectedCells: Array<[x: number, y: number]>; chainBombs: Array<[x: number, y: number]> } {
    const affectedCells: Array<[x: number, y: number]> = [];
    const chainBombs: Array<[x: number, y: number]> = [];

    for (const [bx, by] of positions) {
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const tx = bx + dx;
          const ty = by + dy;
          if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) continue;
          const cell = this.grid[ty][tx];
          if (cell !== null) {
            affectedCells.push([tx, ty]);
            // 发现连锁炸弹（排除爆炸中心，避免重复）
            if (cell.bomb && !cell.bomb.armed && !(tx === bx && ty === by)) {
              chainBombs.push([tx, ty]);
            }
          }
        }
      }
    }

    return { affectedCells, chainBombs };
  }

  // 移除指定位置的格子并应用重力下落
  removeCellsAndApplyGravity(positions: Array<[x: number, y: number]>): void {
    if (positions.length === 0) return;

    // 先将所有指定位置设为 null
    for (const [x, y] of positions) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.grid[y][x] = null;
      }
    }

    // 逐列应用重力下落
    for (let x = 0; x < this.width; x++) {
      // 从底部向上收集非空格子
      const column: Cell[] = [];
      for (let y = this.height - 1; y >= 0; y--) {
        if (this.grid[y][x] !== null) {
          column.push(this.grid[y][x]);
        }
      }
      // 从底部重新填充
      for (let y = this.height - 1; y >= 0; y--) {
        const idx = this.height - 1 - y;
        this.grid[y][x] = idx < column.length ? column[idx] : null;
      }
    }
  }
}
