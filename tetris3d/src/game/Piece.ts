import { PieceType, getPieceShape, getPieceColor, randomPieceType } from './shapes.ts';
import { BOARD_WIDTH } from './Board.ts';

// 方块类
export class Piece {
  private type: PieceType;
  private x: number;
  private y: number;
  private rotation: number;
  private color: number;

  constructor(type?: PieceType) {
    this.type = type ?? randomPieceType();
    this.color = getPieceColor(this.type);
    this.x = Math.floor(BOARD_WIDTH / 2) - 1;
    this.y = 0;
    this.rotation = 0;
  }

  // 获取当前方块的所有单元格
  getCells(): number[][] {
    const shape = getPieceShape(this.type);
    const rotated = this.rotateShape(shape, this.rotation);
    return rotated.map(([dx, dy]) => [this.x + dx, this.y + dy]);
  }

  // 获取颜色
  getColor(): number {
    return this.color;
  }

  // 获取类型
  getType(): PieceType {
    return this.type;
  }

  // 移动左（只改变位置，不检查有效性）
  moveLeft(): void {
    this.x--;
  }

  // 移动右（只改变位置，不检查有效性）
  moveRight(): void {
    this.x++;
  }

  // 移动下（只改变位置，不检查有效性）
  moveDown(): void {
    this.y++;
  }

  // 移动上（用于回退）
  moveUp(): void {
    this.y--;
  }

  // 获取旋转角度
  getRotation(): number {
    return this.rotation;
  }

  // 设置旋转角度（用于回退）
  setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  // 旋转（只改变旋转，不检查有效性）
  rotate(): void {
    this.rotation = (this.rotation + 1) % 4;
  }

  // 旋转形状
  private rotateShape(shape: number[][], rotation: number): number[][] {
    let rotated = shape.map(([x, y]) => [...[x, y]]);
    for (let i = 0; i < rotation; i++) {
      rotated = rotated.map(([x, y]) => [-y, x]);
    }
    return rotated;
  }

  // 克隆方块
  clone(): Piece {
    const newPiece = new Piece(this.type);
    newPiece.x = this.x;
    newPiece.y = this.y;
    newPiece.rotation = this.rotation;
    return newPiece;
  }

  // 获取位置
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
