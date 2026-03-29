# Sprint 5 合约 - 碰撞弹跳与消除特效增强

**创建日期**: 2026-03-27
**目标**: 为方块落地添加Q弹的碰撞形变动画和冲击波特效，增强行消除的视觉冲击力

---

## 现有代码分析

### 当前落地动画（GameBoard.tsx）
- 使用简单的正弦波弹跳：`Math.sin(landingAnimation.progress * Math.PI) * 0.1`
- 仅影响 Z 轴位置，没有形变效果
- 200ms 持续时间，无粒子爆发
- 每次 `board` 变化时触发（不区分是否真正落地）

### 当前行消除特效（LineClearEffect.tsx）
- 白色发光方块的脉冲缩放
- 使用 `ParticleSystem` 产生 30 个青色粒子
- 500ms 持续时间
- 没有碎片飞散、没有颜色匹配、没有连击增强

### 现有工具
- `animation.ts`: `Easing.easeOutBounce`, `Easing.easeOutElastic`, `AnimationManager`
- `useScreenShake.ts`: 独立的屏幕震动 hook（使用正弦波衰减）
- `tetrisStore.ts`: 已有 `screenShakeIntensity`, `clearedRows` 状态
- `ParticleSystem.tsx`: 通用粒子系统，支持颜色/数量/位置

---

## 功能分解

### Feature 1: Q弹落地形变动画

**目标**: 方块着地时产生物理感十足的弹性形变（挤压+拉伸）

#### 1.1 状态扩展（tetrisStore.ts）

在 `TetrisState` 接口中新增：

```typescript
// 新增状态字段
landingImpact: {
  position: [number, number, number]; // 落地中心坐标（Three.js 世界坐标）
  color: number;                       // 方块颜色
  progress: number;                    // 动画进度 0-1
  intensity: number;                   // 碰撞强度（0-1，硬降=1，软降=0.3）
} | null;

// 新增方法
triggerLandingImpact: (cells: number[][], color: number, isHardDrop: boolean) => void;
updateLandingImpact: (deltaTime: number) => void;
```

**位置计算规则**：
- 取所有 cells 的中心点
- X = `(minX + maxX) / 2 * BLOCK_SIZE + BLOCK_SIZE / 2`
- Y = `(BOARD_HEIGHT - 1 - (minY + maxY) / 2) * BLOCK_SIZE + BLOCK_SIZE / 2`（注意 Y 翻转）
- Z = `BLOCK_SIZE * 0.25`

**强度计算**：
- 硬降（hardDrop）：`intensity = 1.0`
- 普通下落落地：`intensity = 0.3`

#### 1.2 弹性形变动画（GameBoard.tsx）

替换当前简单的正弦波弹跳为多阶段形变动画：

**动画阶段**（总时长 400ms）：

| 阶段 | 时间段 | 效果 |
|------|--------|------|
| 压缩 | 0-80ms | Y 轴缩放到 0.6，X/Z 轴膨胀到 1.25 |
| 回弹1 | 80-200ms | Y 轴弹到 1.15，X/Z 轴收缩到 0.92 |
| 回弹2 | 200-320ms | Y 轴回到 0.95，X/Z 轴回到 1.03 |
| 恢复 | 320-400ms | 所有轴回到 1.0 |

**缓动函数**：在 `animation.ts` 中新增 `easeOutSquash`：

```typescript
// 挤压回弹缓动 - 模拟弹性碰撞
easeOutSquash: (t: number): number => {
  if (t < 0.2) {
    // 快速压缩阶段
    return -0.4 * (1 - Math.pow(t / 0.2, 2));
  } else {
    // 弹性恢复阶段
    const t2 = (t - 0.2) / 0.8;
    return Math.sin(t2 * Math.PI * 2.5) * Math.exp(-t2 * 3);
  }
};
```

**实现方式**：
- 为已放置方块中刚落地的 cell 添加 per-cell 的 scale 动画
- 使用 `useRef` 存储动画状态，在 `useFrame` 中更新 `InstancedMesh` 的矩阵
- 需要将刚放置的 cell 位置传入，以便仅对这些 cell 做形变

#### 1.3 落地粒子爆发

创建新组件 `src/components/effects/LandingBurstEffect.tsx`：

**规格**：
- 在落地位置产生 15-25 个粒子（硬降 25 个，软降 15 个）
- 粒子颜色与方块颜色一致
- 粒子初始速度主要沿 XZ 平面向外扩散，Y 方向略向上
- 粒子大小：`0.03 + Math.random() * 0.06`
- 粒子生命周期：300-500ms
- 重力效果：粒子 Y 速度以 `-0.002/frame` 衰减
- 使用 `THREE.Points` + `AdditiveBlending` 实现发光效果

**粒子速度分布**：
```
vx = (Math.random() - 0.5) * 0.15
vy = Math.random() * 0.08
vz = (Math.random() - 0.5) * 0.1 + 0.05  // 略微偏向观察者方向
```

#### 1.4 落地屏幕微震

扩展 `triggerScreenShake` 调用：
- 硬降：`triggerScreenShake(0.4)`，持续 150ms
- 软降：`triggerScreenShake(0.15)`，持续 100ms
- 使用现有的 `updateScreenShake` 机制

#### 1.5 修改回调传递落地信息

在 `TetrisGame.ts` 中修改 `onPiecePlaced` 回调签名：

```typescript
// 旧：
private onPiecePlaced: (() => void) | null = null;

// 新：
private onPiecePlaced: ((cells: number[][], color: number, isHardDrop: boolean) => void) | null = null;
```

在 `placePiece()` 方法中调用时传递参数：

```typescript
if (this.onPiecePlaced) {
  this.onPiecePlaced(cells, color, this.wasHardDrop);
}
```

新增 `wasHardDrop` 标记：
- 在 `hardDrop()` 方法中设置 `this.wasHardDrop = true`
- 在 `drop()` 方法中设置 `this.wasHardDrop = false`
- `placePiece()` 读取后重置为 `false`

---

### Feature 2: 碰撞波纹特效

**目标**: 方块落地时从着地点向外扩散的环形冲击波

#### 2.1 创建波纹组件

新建 `src/components/effects/ImpactRipple.tsx`：

**Props**：
```typescript
interface ImpactRippleProps {
  position: [number, number, number]; // 波纹中心
  color: number;                       // 方块颜色
  intensity: number;                   // 0-1
  onComplete?: () => void;
}
```

**视觉规格**：
- 使用 `THREE.RingGeometry` 创建环形
- 环形在 XY 平面上（与游戏面板平行）
- 初始内半径 `0.1`，外半径 `0.3`
- 最终内半径 `BOARD_WIDTH * 0.8`，外半径 `BOARD_WIDTH * 0.85`
- 动画时长 600ms
- 透明度从 `0.8 * intensity` 衰减到 `0`
- 颜色为方块颜色的亮化版本

**动画细节**：
- 半径使用 `easeOutExpo` 缓动（快速展开，缓慢到达）
- 透明度使用 `easeOutQuad` 缓动（逐渐消失）
- Z 位置从 `BLOCK_SIZE * 0.3` 到 `BLOCK_SIZE * 0.1`（略向前移动，产生深度感）

**实现要点**：
- 使用 `useRef<THREE.Mesh>` 直接操作 RingGeometry
- 在 `useFrame` 中更新 geometry 的 `innerRadius` 和 `outerRadius`
- 注意 `RingGeometry` 每帧需要重新创建或使用 `THREE.Shape` 方式
- 推荐方案：使用 `THREE.Mesh` + 自定义 `ShaderMaterial` 或每帧更新 `scale` 而非重建 geometry

**推荐的简化实现**：
- 创建固定大小的 `RingGeometry(0.5, 0.6, 32)`
- 通过 `mesh.scale.set(scaleX, scaleY, 1)` 控制扩散
- scaleX/scaleY 从 `0.2` 到 `BOARD_WIDTH * 1.5`（覆盖整个面板宽度）

#### 2.2 在 GameScene 中集成波纹

在 `Game.tsx` 的 `GameScene` 组件中添加：

```tsx
{/* Landing impact effects */}
{landingImpact && (
  <>
    <ImpactRipple
      position={landingImpact.position}
      color={landingImpact.color}
      intensity={landingImpact.intensity}
      onComplete={() => useTetrisStore.getState().clearLandingImpact()}
    />
    <LandingBurstEffect
      position={landingImpact.position}
      color={landingImpact.color}
      intensity={landingImpact.intensity}
    />
  </>
)}
```

---

### Feature 3: 增强行消除特效

**目标**: 消除行时产生爆炸式粒子散射和碎片飞散效果

#### 3.1 状态扩展（tetrisStore.ts）

```typescript
// 新增状态字段
lineClearEffects: {
  rows: number[];
  rowColors: number[][];    // 每行每个 cell 的颜色
  combo: number;            // 连击数
  timestamp: number;        // 触发时间
} | null;

// 新增方法
triggerLineClearEnhanced: (rows: number[], rowColors: number[][], combo: number) => void;
```

**连击追踪**：
- 在 store 中新增 `comboCount: number`
- 每次 `triggerLineClear` 时递增 `comboCount`
- 在 `restart` 时重置 `comboCount = 0`
- 如果超过 3 秒没有新的消除，重置 `comboCount = 0`（在 `update` 中检查）

#### 3.2 获取消除行颜色数据

在 `TetrisGame.ts` 的 `placePiece` 方法中，在调用 `board.checkLines()` 之前获取即将消除的行颜色：

```typescript
const result = this.board.checkLines();
if (result.linesCleared > 0) {
  // 获取消除行的颜色数据
  const rowColors = result.clearedRows.map(row =>
    this.board.getGrid()[row].map(cell => cell as number)
  );
  this.addScore(result.linesCleared);
  if (this.onLinesCleared) {
    this.onLinesCleared(result.linesCleared, result.clearedRows, rowColors);
  }
}
```

更新回调签名：
```typescript
private onLinesCleared: ((lines: number, rows: number[], rowColors: number[][]) => void) | null = null;
```

#### 3.3 重写 LineClearEffect.tsx

替换现有的简单效果为多阶段爆炸效果：

**阶段1 - 闪光（0-150ms）**：
- 每行一个白色高亮条，使用 `MeshBasicMaterial` + `AdditiveBlending`
- 透明度从 `0.9` 到 `0`，使用 `easeOutExpo`
- Z 轴从 `0.25` 到 `1.0`（向观察者冲来）

**阶段2 - 碎片飞散（100-800ms）**：
- 创建新组件 `src/components/effects/DebrisEffect.tsx`
- 每行每个 cell 生成一个方形碎片
- 碎片使用 `THREE.BoxGeometry(BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.2)`
- 碎片颜色与原始 cell 颜色一致

**碎片物理**：
```
初始位置: cell 的世界坐标
初始速度:
  vx = (Math.random() - 0.5) * 0.3
  vy = Math.random() * 0.15 + 0.1    // 主要向上飞
  vz = Math.random() * 0.2 + 0.05    // 向观察者飞来
旋转速度:
  rx = (Math.random() - 0.5) * 10
  ry = (Math.random() - 0.5) * 10
  rz = (Math.random() - 0.5) * 10
重力: vy -= 0.004 / frame
透明度: 800ms 后开始衰减，1000ms 完全消失
```

**阶段3 - 粒子散射（150-700ms）**：
- 在每行中心位置产生 40-60 个粒子（行数越多，每行粒子越多）
- 粒子颜色从行的颜色中随机选取
- 粒子速度比当前实现更快、方向更随机
- 粒子带拖尾效果（通过每帧缩小 size 实现）

#### 3.4 连击增强效果

**连击等级视觉映射**：

| 连击数 | 震动强度 | 粒子数量 | 碎片速度倍率 | 额外效果 |
|--------|----------|----------|-------------|---------|
| 1 | 0.3 | 40/行 | 1.0x | 无 |
| 2 | 0.5 | 55/行 | 1.3x | 屏幕边缘白色闪光 |
| 3 | 0.7 | 70/行 | 1.6x | 屏幕边缘白色闪光 |
| 4+ | 1.0 | 90/行 | 2.0x | 全屏白色闪光 + 更强震动 |

**屏幕边缘闪光实现**：
- 使用 `THREE.PlaneGeometry` 覆盖整个视口
- `MeshBasicMaterial`，白色，`AdditiveBlending`
- 从四边向中心渐变透明
- 持续 200ms，透明度从 `0.3 * comboMultiplier` 衰减到 `0`

新建 `src/components/effects/ComboFlashEffect.tsx`：

```typescript
interface ComboFlashEffectProps {
  intensity: number; // 0-1
}
```

使用 `THREE.ShaderMaterial` 或 CSS overlay 实现渐变边缘闪光。推荐 CSS overlay（简单可靠）：

- 在 `Game.tsx` 中添加一个绝对定位的 `div`
- 使用 CSS `radial-gradient` 从边缘白色渐变到中心透明
- `pointer-events: none`
- 透明度由 store 中的 combo flash 状态控制

#### 3.5 多行消除增强

当同时消除多行时：
- 2行：震动强度 `* 1.5`，粒子数量 `* 1.3`
- 3行：震动强度 `* 2.0`，粒子数量 `* 1.6`，额外闪光
- 4行（Tetris）：震动强度 `* 3.0`，粒子数量 `* 2.0`，全屏闪光 + 特殊颜色（金色 `0xFFD700`）粒子混入

---

## 文件变更清单

### 新建文件

| 文件 | 用途 |
|------|------|
| `src/components/effects/LandingBurstEffect.tsx` | 落地粒子爆发组件 |
| `src/components/effects/ImpactRipple.tsx` | 碰撞波纹扩散组件 |
| `src/components/effects/DebrisEffect.tsx` | 消除行碎片飞散组件 |
| `src/components/effects/ComboFlashEffect.tsx` | 连击闪光组件 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/stores/tetrisStore.ts` | 新增 `landingImpact`、`comboCount`、`comboFlashIntensity` 状态及相关方法 |
| `src/components/GameBoard.tsx` | 替换落地动画为弹性形变，添加 per-cell scale 动画 |
| `src/components/effects/LineClearEffect.tsx` | 重写为多阶段爆炸效果，集成碎片和增强粒子 |
| `src/components/Game.tsx` | 集成新特效组件，添加 combo flash overlay |
| `src/game/TetrisGame.ts` | 扩展回调签名，添加 `wasHardDrop` 标记，传递 `rowColors` |
| `src/utils/animation.ts` | 新增 `easeOutSquash` 缓动函数 |

---

## 数据流

### 方块落地流程

```
TetrisGame.placePiece()
  -> this.wasHardDrop 判断落地类型
  -> onPiecePlaced(cells, color, isHardDrop)
      -> tetrisStore: triggerLandingImpact(cells, color, isHardDrop)
          -> 计算 position, intensity
          -> 设置 landingImpact 状态
          -> triggerScreenShake(intensity)
      -> tetrisStore: triggerUpdate()
          -> GameScene 重新渲染
              -> LandingBurstEffect 播放粒子
              -> ImpactRipple 播放波纹
              -> GameBoard 中刚放置的 cells 播放形变动画
```

### 行消除流程

```
TetrisGame.placePiece()
  -> board.checkLines() -> { linesCleared, clearedRows }
  -> 获取 rowColors
  -> onLinesCleared(lines, rows, rowColors)
      -> tetrisStore: comboCount++
      -> tetrisStore: triggerLineClearEnhanced(rows, rowColors, combo)
      -> tetrisStore: triggerScreenShake(intensity * comboMultiplier)
      -> tetrisStore: triggerComboFlash(combo)
          -> GameScene 重新渲染
              -> LineClearEffect（重写版）播放
                  -> 闪光阶段
                  -> DebrisEffect 碎片飞散
                  -> 增强粒子散射
              -> ComboFlashEffect（combo >= 2 时）
```

---

## 验收标准

### Feature 1: Q弹落地形变

- [ ] 方块落地时可见明显的 Y 轴压缩效果（压扁）
- [ ] 压缩后可见弹性回弹（先变高再恢复）
- [ ] 压缩同时 X/Z 轴膨胀（体积守恒感）
- [ ] 硬降比普通下落的形变更明显
- [ ] 形变动画流畅，400ms 内完成
- [ ] 落地时有粒子爆发，颜色与方块一致
- [ ] 落地时有轻微屏幕震动
- [ ] 动画期间游戏不卡顿（60fps 稳定）

### Feature 2: 碰撞波纹

- [ ] 落地时从着地点可见环形波纹向外扩散
- [ ] 波纹颜色与方块颜色相关（亮化版本）
- [ ] 波纹随距离增大逐渐变透明
- [ ] 波纹在 600ms 内完全消失
- [ ] 硬降波纹比软降更大更明显
- [ ] 波纹不会穿透游戏面板边界

### Feature 3: 增强消除特效

- [ ] 消除行时有白色闪光从行位置爆发
- [ ] 消除行的方块碎片向四周飞散
- [ ] 碎片颜色与原始方块颜色一致
- [ ] 碎片有旋转效果和重力下落
- [ ] 碎片在约 800ms 后完全消失
- [ ] 粒子数量多于当前版本（40+/行）
- [ ] 粒子颜色使用消除行中方块的实际颜色

### Feature 3a: 连击增强

- [ ] 连续消除时 combo 计数器递增
- [ ] 2连击：更强的屏幕震动和边缘闪光
- [ ] 3连击：更强效果 + 更明显的闪光
- [ ] 4+连击：全屏闪光 + 金色粒子混入
- [ ] 超过 3 秒无新消除时 combo 重置
- [ ] 重新开始游戏时 combo 重置

### Feature 3b: 多行消除增强

- [ ] 2行消除效果明显强于单行
- [ ] 3行消除有额外视觉增强
- [ ] 4行消除（Tetris）有特殊金色粒子效果
- [ ] 多行消除的屏幕震动更强

### 通用验收

- [ ] 所有新特效动画期间帧率不低于 50fps
- [ ] 快速连续操作（如连续硬降）时特效不堆积导致卡顿
- [ ] 多个特效同时播放时互不干扰
- [ ] TypeScript 编译无错误
- [ ] 新组件有完整的类型定义
- [ ] 无硬编码的魔法数字（使用命名常量）

---

## 性能约束

- 粒子总数上限：同时存在不超过 500 个活跃粒子
- 碎片总数上限：同时存在不超过 200 个活跃碎片
- 波纹效果：同时最多 2 个活跃波纹
- 超过上限时：跳过新特效的创建（而非降低帧率）
- 所有动画组件必须在动画结束后自动清理（unmount 或标记不可见）

---

## 实现优先级

1. **P0 - 必须实现**: 弹性形变动画、落地粒子爆发、增强消除粒子
2. **P1 - 应该实现**: 碰撞波纹、碎片飞散、连击增强
3. **P2 - 锦上添花**: 多行消除特殊效果、combo flash overlay

Generator 应按 P0 -> P1 -> P2 的顺序实现，确保核心体验优先。
