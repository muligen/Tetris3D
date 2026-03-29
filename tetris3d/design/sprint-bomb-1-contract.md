# Sprint 1 合约 - 数据结构扩展与配置系统

## 我将构建

### 1. Board.ts - Cell 数据结构扩展
**当前状态**: `Cell = number | null`
**目标状态**: 支持炸弹元数据的复杂结构

**具体变更**:
- 新增 `BombMetadata` 接口
  ```typescript
  export interface BombMetadata {
    type: 'combo' | 'random';  // 炸弹来源
    armed: boolean;            // 是否已激活
  }
  ```

- 新增 `CellData` 接口
  ```typescript
  export interface CellData {
    color: number;       // 方块颜色
    bomb?: BombMetadata; // 可选的炸弹信息
  }
  ```

- 更新 `Cell` 类型定义
  ```typescript
  export type Cell = CellData | null;
  ```

- 更新 `placePiece` 方法：从 `this.grid[y][x] = color` 改为 `this.grid[y][x] = { color }`

- 更新 `checkLines` 方法：从 `cell as number` 改为 `(cell as CellData).color`

- 更新 `clone` 方法：实现深拷贝 CellData 对象

- 更新 `getOccupiedCells` 方法：返回类型改为 `Array<[x: number, y: number, cell: CellData]>`

- 新增 `placePieceWithBombs` 方法：
  ```typescript
  placePieceWithBombs(cells: number[][], color: number, bombCells: number[], bombType: 'combo' | 'random'): void
  ```

### 2. GameMode.ts - 配置系统扩展
**新增内容**:
- `BombConfig` 接口（包含所有炸弹相关配置参数）
- `DEFAULT_BOMB_CONFIG` 常量
- 在 `GameModeConfig` 中添加 `bombConfig?: Partial<BombConfig>` 字段
- `mergeBombConfig` 辅助函数（合并默认配置和模式特定配置）

**配置参数**:
```typescript
export interface BombConfig {
  comboBombThreshold: number;      // 达到此 combo 数获得炸弹（默认 2）
  comboBombSlots: number;           // 每次奖励给当前方块的炸弹格子数（默认 1）
  randomBombChance: number;         // 方块生成时携带炸弹的概率（默认 0.1）
  maxBombsPerPiece: number;         // 单个方块最多炸弹数（默认 1）
  explosionRange: number;           // 爆炸半径：1=3x3, 2=5x5（默认 1）
  explosionDelay: number;           // 炸弹激活后的爆炸延迟 ms（默认 300）
  chainReactionEnabled: boolean;    // 是否允许连锁反应（默认 true）
  maxChainDepth: number;            // 最大连锁深度（默认 10）
  explosionParticles: boolean;      // 是否启用爆炸粒子特效
  explosionShakeIntensity: number;  // 爆炸屏幕震动强度（默认 0.8）
  bombRewardTarget: 'current' | 'next'; // combo 奖励炸弹添加到当前或下一个方块
  comboWindowMs: number;            // combo 窗口时间 ms（默认 3000）
}
```

### 3. Piece.ts - 炸弹追踪系统
**新增字段**:
- `private bombs: Set<number>` - 存储带炸弹的格子索引

**新增方法**:
- `addBomb(cellIndex: number): boolean` - 为指定格子添加炸弹
- `hasBombAt(cellIndex: number): boolean` - 检查指定格子是否有炸弹
- `getBombCellIndices(): number[]` - 获取所有炸弹格子的索引
- `clearBombs(): void` - 清除所有炸弹
- `getBombCount(): number` - 获取炸弹数量

**修改方法**:
- `clone()` - 复制 bombs Set

### 4. GameConfig.ts - 新文件
**目的**: 集中管理所有游戏配置，方便后续调整

**导出内容**:
- 所有类型定义（BombConfig、GameModeConfig 等）
- DEFAULT_BOMB_CONFIG 常量
- 配置合并工具函数

## 验证方式

### 1. TypeScript 编译检查
```bash
cd c:\Users\XSJ\Desktop\test\tetris3d
npx tsc --noEmit
```
预期：无类型错误

### 2. 单元测试验证（手动）
- 创建 Board 实例，使用新的 `placePieceWithBombs` 方法放置带炸弹的格子
- 检查返回的 Cell 对象包含正确的 bomb 元数据
- 调用 `checkLines` 确保能正确处理 CellData
- 创建 Piece 实例，测试 `addBomb`、`hasBombAt` 等方法
- 测试 Piece.clone() 确保炸弹信息被正确复制

### 3. 向后兼容性验证
- 检查所有使用 `cell !== null` 的代码（预期无需修改，因为 CellData 是 truthy）
- 检查所有使用 `cell as number` 的代码（需要更新为 `(cell as CellData).color`）

## 完成标准

### 代码质量
- ✅ 所有文件通过 TypeScript 类型检查
- ✅ 新的 Cell 类型与现有代码向后兼容
- ✅ 没有硬编码的配置值，所有参数都在 BombConfig 中定义
- ✅ 代码组织清晰，每个文件职责单一

### 功能完整性
- ✅ Cell 数据结构能正确存储炸弹元数据
- ✅ Board 能正确放置和读取带炸弹的格子
- ✅ Piece 能追踪和管理炸弹信息
- ✅ 配置系统完整，所有参数都有默认值

### 不修改的内容（Sprint 1 范围外）
- ❌ 不修改渲染层（React、Three.js）
- ❌ 不修改游戏循环或流程
- ❌ 不实现炸弹爆炸逻辑（Sprint 2）
- ❌ 不实现 UI 反馈（Sprint 5）

## 技术细节

### 向后兼容设计
关键决策：`Cell = CellData | null` 而不是 `Cell = number | CellData | null`

**理由**:
1. 现有代码大量使用 `cell !== null` 检查，CellData 是对象，truthy 检查自动兼容
2. 只需更新 `cell as number` 类型断言为 `(cell as CellData).color`
3. 最小化对现有代码的破坏性变更

**影响的方法**:
- `Board.isValidPosition`: 无需修改（`cell !== null` 兼容）
- `Board.placePiece`: 需要修改（直接赋值改为创建对象）
- `Board.checkLines`: 需要修改（类型断言更新）
- `Board.isGameOver`: 无需修改（`cell !== null` 兼容）
- `Board.getOccupiedCells`: 需要修改（返回值类型更新）

### 深拷贝实现
`Board.clone()` 需要深拷贝 CellData：
```typescript
clone(): Board {
  const newBoard = new Board(this.width, this.height);
  newBoard.grid = this.grid.map(row =>
    row.map(cell => cell === null ? null : { ...cell })
  );
  return newBoard;
}
```

### 配置合并策略
```typescript
function mergeBombConfig(modeConfig?: Partial<BombConfig>): BombConfig {
  return { ...DEFAULT_BOMB_CONFIG, ...modeConfig };
}
```

## 风险点与缓解

### 风险 1: 类型断言遗漏
**问题**: 可能遗漏某些地方的 `cell as number` 断言更新
**缓解**: 使用 TypeScript 编译检查 + grep 搜索所有 `as number` 的使用

### 风险 2: 深拷贝性能
**问题**: 每次克隆都需要深拷贝所有 CellData
**缓解**: Board 克隆不频繁（仅在 Ghost Piece 计算），性能影响可接受

### 风险 3: 配置复杂度
**问题**: 10+ 配置参数可能导致调优困难
**缓解**: 提供合理的默认值，Sprint 1 不实现动态配置
