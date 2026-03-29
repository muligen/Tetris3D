# 3D Tetris - 炸弹系统产品规格

## 概述

**项目描述**: 为 3D 俄罗斯方块游戏添加炸弹奖励机制，通过 Combo 连击和随机概率为玩家提供战略性的消除工具，增强游戏的策略深度和爽快感。

**目标用户**: 所有 3D Tetris 玩家，特别是追求高分和连锁反应效果的中高级玩家。

**核心价值**:
- **策略增强**: 炸弹可以作为"救命稻草"消除危险区域的方块
- **爽快反馈**: 炸弹爆炸的连锁反应带来极致的视觉和分数奖励
- **风险回报**: 玩家需要规划炸弹放置位置以最大化收益

---

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 前端 | React + Three.js | 现有渲染架构 |
| 状态管理 | Zustand | 现有 tetrisStore 扩展 |
| 游戏逻辑 | TypeScript | TetrisGame, Board, Piece 类扩展 |
| 配置系统 | TypeScript 配置对象 | GameModeConfig 扩展 |

---

## 功能分解

### Sprint 1: 数据结构与配置系统

**目标**: 建立炸弹系统的数据基础，实现可配置参数系统

**功能**:

1. **扩展 Cell 数据结构**
   - 将 `Board.Cell` 从 `number \| null` 扩展为支持炸弹元数据的结构
   - 定义 `BombMetadata` 接口（类型、激活状态、创建时间等）

2. **配置系统扩展**
   - 在 `GameModeConfig` 中添加炸弹相关配置项
   - 创建独立的 `BombConfig` 接口用于炸弹专用参数

**验收标准**:
- ✅ 新的 Cell 类型能兼容现有代码（向后兼容）
- ✅ 所有配置参数都有默认值且可修改
- ✅ TypeScript 类型检查无错误

**技术要点**:

```typescript
// Board.ts - Cell 扩展
export interface BombMetadata {
  type: 'combo' | 'random';  // 炸弹来源
  armed: boolean;            // 是否已激活
  createdAt: number;         // 创建时间戳
}

export type Cell = number | CellWithBomb;

export interface CellWithBomb {
  color: number;
  bomb?: BombMetadata;
}

// GameMode.ts - 配置扩展
export interface BombConfig {
  // Combo 奖励配置
  comboBombThreshold: number;     // 达到此 combo 数获得炸弹（默认 2）
  comboBombSlots: number;          // 每次奖励给当前方块的炸弹格子数（默认 1）

  // 随机炸弹配置
  randomBombChance: number;        // 方块生成时携带炸弹的概率（默认 0.1）
  maxBombsPerPiece: number;        // 单个方块最多炸弹数（默认 1）

  // 爆炸配置
  explosionRange: number;          // 爆炸半径：1=3x3, 2=5x5（默认 1）
  explosionDelay: number;          // 炸弹激活后的爆炸延迟 ms（默认 300）
  chainReactionEnabled: boolean;   // 是否允许连锁反应（默认 true）
  maxChainDepth: number;           // 最大连锁深度（默认 10）

  // 特效配置
  explosionParticles: boolean;     // 是否启用爆炸粒子特效
  explosionShakeIntensity: number; // 爆炸屏幕震动强度（默认 0.8）
}

export interface GameModeConfig {
  // ... 现有字段
  bombConfig?: Partial<BombConfig>; // 各模式可覆盖默认配置
}

// 默认配置
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
};
```

---

### Sprint 2: 核心 Bomb 逻辑实现

**目标**: 实现炸弹生成、携带、激活和爆炸的核心逻辑

**功能**:

1. **Piece 炸弹携带系统**
   - `Piece` 类添加炸弹存储和追踪
   - 方块生成时随机炸弹分配逻辑
   - Combo 达标时炸弹添加逻辑

2. **Board 炸弹放置与追踪**
   - 修改 `placePiece` 处理带炸弹的格子
   - 维护炸弹位置索引表（快速查询）
   - 炸弹状态管理（待激活 -> 已激活 -> 已爆炸）

3. **爆炸计算逻辑**
   - 计算爆炸影响范围的格子
   - 执行方块消除
   - 连锁反应检测与执行

**验收标准**:
- ✅ 随机炸弹以配置的概率生成
- ✅ Combo 2+ 时正确添加炸弹到当前/下一个方块
- ✅ 消行时正确检测和激活炸弹
- ✅ 爆炸正确消除 3x3 范围内方块
- ✅ 连锁反应正常工作且有最大深度限制
- ✅ 爆炸不影响边界外的区域

**技术要点**:

```typescript
// Piece.ts - 扩展
export class Piece {
  // ... 现有字段
  private bombs: Set<number> = new Set(); // 存储带炸弹的格子索引

  // 为指定格子添加炸弹
  addBomb(cellIndex: number): boolean {
    if (this.bombs.size >= this.getMaxBombsPerPiece()) return false;
    this.bombs.add(cellIndex);
    return true;
  }

  // 获取带炸弹的格子索引列表
  getBombCells(): number[] {
    return Array.from(this.bombs);
  }

  // 检查指定格子是否有炸弹
  hasBombAt(cellIndex: number): boolean {
    return this.bombs.has(cellIndex);
  }
}

// Board.ts - 扩展
export class Board {
  // ... 现有字段
  private bombIndex: Map<string, BombMetadata> = new Map(); // "x,y" -> 炸弹信息

  // 放置带炸弹的方块
  placePieceWithBombs(cells: number[][], color: number, bombCells: number[]): void {
    for (let i = 0; i < cells.length; i++) {
      const [x, y] = cells[i];
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const hasBomb = bombCells.includes(i);
        this.grid[y][x] = { color, bomb: hasBomb ? this.createBomb('random') : undefined };
        if (hasBomb) {
          this.bombIndex.set(`${x},${y}`, this.grid[y][x].bomb!);
        }
      }
    }
  }

  // 检查并清除满行，返回炸弹位置
  checkLinesWithBombs(): { linesCleared: number; clearedRows: number[]; bombPositions: Array<[x, number, y: number]> } {
    // ... 现有消行逻辑
    // 返回被消除行中的炸弹位置
  }

  // 激活并处理炸弹爆炸
  detonateBombs(positions: Array<[x: number, y: number]>): ExplosionResult {
    const affectedCells: Array<[x: number, y: number]> = [];
    const newBombs: Array<[x: number, y: number]> = []; // 连锁激活的新炸弹

    for (const [bx, by] of positions) {
      const bomb = this.bombIndex.get(`${bx},${by}`);
      if (!bomb || bomb.armed) continue;

      // 标记为已激活
      bomb.armed = true;

      // 计算爆炸范围
      const range = this.getExplosionRange();
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const tx = bx + dx;
          const ty = by + dy;
          if (this.isValidCell(tx, ty)) {
            const cell = this.grid[ty][tx];
            if (cell !== null) {
              affectedCells.push([tx, ty]);
              // 检查是否有新炸弹被引爆（连锁）
              if (cell.bomb && !cell.bomb.armed) {
                newBombs.push([tx, ty]);
              }
            }
          }
        }
      }
    }

    // 消除受影响的格子
    this.removeCells(affectedCells);

    return { affectedCells, newBombs };
  }
}
```

---

### Sprint 3: 游戏流程集成

**目标**: 将炸弹系统集成到 TetrisGame 主游戏循环中

**功能**:

1. **炸弹奖励触发**
   - 在消行回调中检测 combo
   - 达到阈值时为当前/下一个方块添加炸弹
   - 支持配置选择添加到当前方块或下一个方块

2. **随机炸弹生成**
   - 在 `spawnNewPiece` 中应用随机炸弹概率
   - 确保炸弹不会生成在无效位置

3. **爆炸流程处理**
   - 消行后触发炸弹检测
   - 延迟激活炸弹（视觉预览）
   - 处理连锁反应
   - 计算爆炸分数

**验收标准**:
- ✅ Combo 2+ 时正确触发炸弹奖励
- ✅ 随机炸弹按配置概率生成
- ✅ 炸弹爆炸后正确更新游戏板
- ✅ 连锁反应不会无限循环
- ✅ 分数正确计算（包括爆炸奖励）

**技术要点**:

```typescript
// TetrisGame.ts - 扩展
export class TetrisGame {
  // ... 现有字段
  private pendingExplosions: Array<{ positions: Array<[x: number, y: number]>; delay: number }> = [];

  // 扩展消行回调
  private onLinesClearedExtended(lines: number, rows: number[], bombPositions: Array<[x: number, y: number]>) {
    // 现有逻辑...

    // 处理炸弹
    if (bombPositions.length > 0) {
      this.scheduleExplosion(bombPositions, this.bombConfig.explosionDelay);
    }
  }

  // 为方块添加炸弹（Combo 奖励）
  grantBombToPiece(target: 'current' | 'next' = 'current'): boolean {
    const piece = target === 'current' ? this.currentPiece : this.getNextPiece();
    if (!piece) return false;

    const cells = piece.getCells();
    const validIndices = cells.map((_, i) => i).filter(i => !piece.hasBombAt(i));

    if (validIndices.length === 0) return false;

    const randomIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
    return piece.addBomb(randomIndex);
  }

  // 调度爆炸
  private scheduleExplosion(positions: Array<[x: number, y: number]>, delay: number) {
    this.pendingExplosions.push({ positions, delay });
  }

  // 更新爆炸（在 update 中调用）
  private updateExplosions(deltaTime: number) {
    this.pendingExplosions = this.pendingExplosions.filter(explosion => {
      explosion.delay -= deltaTime;
      if (explosion.delay <= 0) {
        this.executeExplosion(explosion.positions);
        return false;
      }
      return true;
    });
  }

  // 执行爆炸（支持连锁）
  private executeExplosion(positions: Array<[x: number, y: number]>, depth: number = 0) {
    if (depth >= this.bombConfig.maxChainDepth) return;

    const result = this.board.detonateBombs(positions);

    // 触发特效
    this.onExplosionTrigger(result.affectedCells, depth);

    // 计算分数
    const explosionScore = result.affectedCells.length * 50 * (depth + 1);
    this.score += explosionScore;

    // 连锁反应
    if (result.newBombs.length > 0 && this.bombConfig.chainReactionEnabled) {
      this.scheduleExplosion(result.newBombs, this.bombConfig.explosionDelay * 0.5);
    }
  }
}
```

---

### Sprint 4: 渲染与特效

**目标**: 实现炸弹的视觉表现和爆炸特效

**功能**:

1. **炸弹渲染**
   - 在方块上渲染炸弹标记（图标或特殊颜色）
   - 区分待激活和已激活状态
   - 炸弹放置/移动时的动画

2. **爆炸特效**
   - 粒子爆炸系统
   - 屏幕震动
   - 闪光效果
   - 连锁反应的视觉提示

**验收标准**:
- ✅ 炸弹在方块上有清晰的视觉标识
- ✅ 炸弹激活前有倒计时动画
- ✅ 爆炸特效爽快且不影响性能
- ✅ 连锁反应有独特的视觉效果（如颜色递进）

**技术要点**:

```typescript
// GameBoard.tsx - 扩展
// 在现有 InstancedMesh 系统基础上添加炸弹渲染

// 方案 1: 使用额外的 InstancedMesh 渲染炸弹图标
// 方案 2: 在现有方块上使用纹理/材质混合

// 炸弹标识组件（3D 图标）
const BombIndicator = ({ position, armed, progress }: { position: [number, number, number]; armed: boolean; progress: number }) => {
  return (
    <group position={position}>
      {/* 炸弹主体 */}
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={armed ? 0xff0000 : 0xff6600} emissive={armed ? 0xff0000 : 0xff3300} />
      </mesh>
      {/* 导火索动画 */}
      {!armed && <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2]} />
        <meshStandardMaterial color={0x654321} />
      </mesh>}
      {/* 闪烁指示 */}
      {armed && <pointLight color={0xff0000} intensity={2 + Math.sin(Date.now() * 0.01) * 1} distance={2} />}
    </group>
  );
};

// 爆炸粒子特效组件
const ExplosionEffect = ({ cells, onComplete }: { cells: Array<[x: number, y: number]>; onComplete: () => void }) => {
  // 使用现有的 ParticleSystem
  // 为每个爆炸位置生成粒子爆发
};

// tetrisStore.ts - 状态扩展
interface TetrisState {
  // ... 现有字段
  activeExplosions: Array<{
    cells: Array<[x: number, y: number]>;
    timestamp: number;
    depth: number;
  }>;
  triggerExplosion: (cells: Array<[x: number, y: number]>, depth: number) => void;
  clearExplosions: () => void;
}
```

---

### Sprint 5: UI 与反馈

**目标**: 完善 UI 显示和玩家反馈

**功能**:

1. **炸弹指示器**
   - 当前方块的炸弹数量显示
   - 炸弹即将激活的提示
   - Combo 进度条显示距离下一个炸弹

2. **爆炸信息面板**
   - 显示本次爆炸消除的方块数
   - 连锁深度计数
   - 爆炸得分

**验收标准**:
- ✅ UI 清晰显示炸弹相关信息
- ✅ Combo 进度直观可见
- ✅ 爆炸反馈信息及时准确

**技术要点**:

```typescript
// UI 组件扩展
interface BombHUDProps {
  bombCount: number;         // 当前方块的炸弹数
  comboProgress: number;     // 0-1, 距离下一个炸弹
  nextBombThreshold: number; // 下一个炸弹需要的 combo
  armedBombs: number;        // 场上待激活炸弹数
}

const BombHUD: React.FC<BombHUDProps> = ({ bombCount, comboProgress, nextBombThreshold, armedBombs }) => {
  return (
    <div className="bomb-hud">
      {/* 炸弹图标 */}
      <div className="bomb-icons">
        {Array.from({ length: bombCount }).map((_, i) => (
          <BombIcon key={i} />
        ))}
      </div>
      {/* Combo 进度条 */}
      <div className="combo-progress">
        <div className="progress-bar" style={{ width: `${comboProgress * 100}%` }} />
        <span className="threshold-text">{nextBombThreshold} COMBO</span>
      </div>
      {/* 待激活炸弹警告 */}
      {armedBombs > 0 && (
        <div className="armed-warning">
          💣 {armedBombs} ARMED!
        </div>
      )}
    </div>
  );
};
```

---

## 配置参数表

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `comboBombThreshold` | number | 2 | 达到此 combo 数获得炸弹 |
| `comboBombSlots` | number | 1 | 每次 combo 奖励的炸弹格子数 |
| `randomBombChance` | number | 0.1 | 方块生成时携带炸弹的概率 (0-1) |
| `maxBombsPerPiece` | number | 1 | 单个方块最多炸弹数 |
| `explosionRange` | number | 1 | 爆炸半径（1=3x3, 2=5x5） |
| `explosionDelay` | number | 300 | 炸弹激活后的爆炸延迟 (ms) |
| `chainReactionEnabled` | boolean | true | 是否允许连锁反应 |
| `maxChainDepth` | number | 10 | 最大连锁深度 |
| `explosionParticles` | boolean | true | 是否启用爆炸粒子特效 |
| `explosionShakeIntensity` | number | 0.8 | 爆炸屏幕震动强度 (0-1) |
| `bombRewardTarget` | 'current' \| 'next' | 'current' | combo 奖励炸弹添加到当前或下一个方块 |
| `comboWindowMs` | number | 3000 | combo 窗口时间 (ms) |

---

## 评估标准

### 功能完整性
- ✅ 所有核心功能可实际工作（非仅 UI 展示）
- ✅ 边缘情况被适当处理（边界炸弹、空板炸弹等）
- ✅ 炸弹不会在游戏异常时卡在错误状态

### 用户体验
- ✅ 炸弹视觉标识清晰，玩家能快速识别
- ✅ 爆炸效果爽快但不影响游戏可玩性
- ✅ Combo 进度和炸弹奖励有直观反馈

### 代码质量
- ✅ 无硬编码值，所有参数可配置
- ✅ 适当的错误处理（无效炸弹位置等）
- ✅ 与现有系统（combo、特效、渲染）无缝集成
- ✅ 性能优化（炸弹索引、批量更新）

### 平衡性
- ✅ 炸弹出现频率合理，不破坏游戏平衡
- ✅ 爆炸奖励与难度匹配
- ✅ 不同游戏模式可独立调参

---

## 依赖关系图

```
Sprint 1 (数据结构)
    ↓
Sprint 2 (核心逻辑) ──→ Sprint 3 (游戏流程)
    ↓                      ↓
Sprint 4 (渲染特效) ────────┘
    ↓
Sprint 5 (UI 反馈)
```

---

## 实现优先级

**P0 (必须实现)**:
- Cell 数据结构扩展
- 炸弹生成逻辑（Combo + 随机）
- 爆炸消除逻辑
- 基础渲染（炸弹标识）

**P1 (重要)**:
- 连锁反应
- 爆炸特效
- 配置系统完整实现

**P2 (可选)**:
- 高级爆炸特效
- 详细 UI 反馈面板
- 不同模式的差异化配置
