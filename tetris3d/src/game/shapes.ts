// 方块类型
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// 方块颜色
export const PIECE_COLORS: Record<PieceType, number> = {
  I: 0x00FFFF, // 青色
  O: 0xFFFF00, // 黄色
  T: 0x800080, // 紫色
  S: 0x00FF00, // 绿色
  Z: 0xFF0000, // 红色
  J: 0x0000FF, // 蓝色
  L: 0xFFA500, // 橙色
};

// 方块形状定义 (相对于中心的坐标)
export const PIECE_SHAPES: Record<PieceType, number[][]> = {
  I: [
    [-1, 0], [0, 0], [1, 0], [2, 0]
  ],
  O: [
    [0, 0], [1, 0], [0, 1], [1, 1]
  ],
  T: [
    [0, 0], [-1, 0], [1, 0], [0, 1]
  ],
  S: [
    [0, 0], [1, 0], [-1, 1], [0, 1]
  ],
  Z: [
    [0, 0], [-1, 0], [0, 1], [1, 1]
  ],
  J: [
    [0, 0], [-1, 0], [1, 0], [-1, 1]
  ],
  L: [
    [0, 0], [-1, 0], [1, 0], [1, 1]
  ]
};

// 获取方块形状
export function getPieceShape(type: PieceType): number[][] {
  return PIECE_SHAPES[type].map(cell => [...cell]);
}

// 获取方块颜色
export function getPieceColor(type: PieceType): number {
  return PIECE_COLORS[type];
}

// 随机生成一个方块
export function randomPieceType(): PieceType {
  const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return types[Math.floor(Math.random() * types.length)];
}
