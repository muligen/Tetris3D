// 游戏板配置
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BLOCK_SIZE = 1;

// 单元格状态
export type Cell = number | null;

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
        this.grid[y][x] = color;
      }
    }
  }

  // 获取网格
  getGrid(): Cell[][] {
    return this.grid;
  }

  // 检查并清除满行，返回清除的行数、行号和每行的颜色
  checkLines(): { linesCleared: number; clearedRows: number[]; clearedRowColors: number[][] } {
    let linesCleared = 0;
    const clearedRows: number[] = [];
    const clearedRowColors: number[][] = [];

    for (let y = this.height - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== null)) {
        // Capture row colors before clearing
        const rowColors = this.grid[y].map(cell => cell as number);
        clearedRowColors.push(rowColors);

        // 移除这一行
        this.grid.splice(y, 1);
        // 在顶部添加新行
        this.grid.unshift(Array(this.width).fill(null));
        clearedRows.push(y);
        linesCleared++;
        y++; // 重新检查这一行
      }
    }

    return { linesCleared, clearedRows, clearedRowColors };
  }

  // 检查游戏是否结束
  isGameOver(): boolean {
    // 检查顶行是否有方块
    return this.grid[0].some(cell => cell !== null);
  }

  // 克隆游戏板
  clone(): Board {
    const newBoard = new Board(this.width, this.height);
    newBoard.grid = this.grid.map(row => [...row]);
    return newBoard;
  }

  // 获取占用状态
  getOccupiedCells(): Array<[x: number, y: number, color: number]> {
    const occupied: Array<[x: number, y: number, color: number]> = [];
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
}
