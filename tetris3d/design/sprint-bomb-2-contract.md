# Sprint 2 合约 - 核心炸弹逻辑

## 我将构建

### 1. TetrisGame.ts 扩展

**a) 炸弹配置加载**
- 添加 `private bombConfig: BombConfig` 字段
- 在 constructor 中使用 `mergeBombConfig()` 初始化配置

**b) 随机炸弹生成**
- 在 `spawnNewPiece()` 中实现随机炸弹生成逻辑
- 使用 `Math.random() < bombConfig.randomBombChance` 判断
- 随机选择格子索引，调用 `piece.addBomb()`
- 确保不超过 `bombConfig.maxBombsPerPiece` 限制

**c) Combo 奖励炸弹**
- 添加 `grantBombReward(combo: number)` 公共方法
- 当 combo >= threshold 时，为当前方块添加炸弹
- 使用 `bombConfig.comboBombSlots` 决定添加数量

**d) 方块放置时传递炸弹信息**
- 修改 `placePiece()` 方法
- 检查 `currentPiece.getBombCellIndices()`
- 如果有炸弹，使用 `board.placePieceWithBombs()`，否则使用 `board.placePiece()`

**e) 消行后炸弹检测和爆炸**
- 在 `placePiece()` 的消行逻辑后添加炸弹检测
- 检查被消除的行中是否有炸弹（使用新增的 Board 方法）
- 如果有炸弹，触发爆炸流程

**f) 爆炸逻辑实现**
- 添加 `triggerExplosions(bombPositions: Array<[x, y]>, depth: number)` 方法
- 使用 `board.detonateAt()` 执行爆炸
- 处理连锁反应（递归调用，受 maxChainDepth 限制）
- 计算爆炸得分：50 × (深度 + 1) × 受影响格子数

**g) 爆炸后重力下落和再检测**
- 爆炸后调用 `board.removeCellsAndApplyGravity()`
- 重新检查满行（调用 `board.checkLines()`）
- 如果有新满行，正常计分并再次检测炸弹

**h) 新增回调**
- `onBombExplosion`: 通知渲染层炸弹爆炸事件
- 参数：爆炸中心位置、受影响格子、连锁深度

### 2. Board.ts 扩展

**新增方法 1: getBombPositionsInRows**
```typescript
getBombPositionsInRows(rows: number[]): Array<[x: number, y: number]>
```
- 遍历指定行，检查每个格子是否有炸弹
- 返回炸弹位置数组

**新增方法 2: detonateAt**
```typescript
detonateAt(positions: Array<[x, number, y: number]>, range: number): {
  affectedCells: Array<[x: number, y: number]>;
  chainBombs: Array<[x: number, y: number]>;
}
```
- 对每个炸弹位置，计算范围爆炸（range=1 为 3x3）
- 返回受影响的格子和新发现的炸弹

**新增方法 3: removeCellsAndApplyGravity**
```typescript
removeCellsAndApplyGravity(positions: Array<[x: number, y: number]>): void
```
- 将指定位置的格子设为 null
- 逐列处理重力下落
- 扫描每列，将上方方块下移填充空隙

### 3. tetrisStore.ts 修改

**在消行回调中添加炸弹奖励逻辑**
- 检查 `comboCount` 是否达到 `bombConfig.comboBombThreshold`
- 如果达到，调用 `game.grantBombReward(comboCount)`
- 确保 bombConfig 可访问（需要在 TetrisGame 添加 getter）

## 验证方式

### 单元验证
1. **随机炸弹测试**
   - 生成 100 个方块，统计携带炸弹的比例
   - 验证不超过 maxBombsPerPiece 限制

2. **Combo 奖励测试**
   - 手动调用 `grantBombReward(2)`
   - 验证当前方块获得炸弹

3. **爆炸测试**
   - 在棋盘上放置带炸弹的方块
   - 消除该行，验证爆炸触发
   - 验证 3x3 范围内的格子被清除

4. **重力下落测试**
   - 在中间位置制造空隙
   - 验证上方方块正确下落

5. **连锁反应测试**
   - 在爆炸范围内放置另一个炸弹
   - 验证连锁反应触发
   - 验证深度限制生效

### 集成验证
1. **游戏流程测试**
   - 完整游戏循环：生成 → 放置 → 消行 → 爆炸 → 下落 → 再检测
   - 验证不破坏原有游戏流程

2. **计分测试**
   - 验证爆炸得分正确计算
   - 验证不影响消行得分

3. **TypeScript 编译**
   - 运行 `npx tsc --noEmit`
   - 确保无类型错误

## 完成标准

### 功能完整性
- ✅ 随机炸弹按配置概率生成
- ✅ Combo 达标时正确添加炸弹
- ✅ 消行正确检测炸弹位置
- ✅ 爆炸正确消除指定范围
- ✅ 重力下落正确工作（逐列处理）
- ✅ 连锁反应有最大深度限制
- ✅ 爆炸后正确重新检测满行

### 代码质量
- ✅ TypeScript 编译无错误
- ✅ 无硬编码值，全部从 bombConfig 读取
- ✅ 保持 TetrisGame 公共 API 不变
- ✅ 新方法有清晰的注释
- ✅ 错误处理完善（边界检查）

### 兼容性
- ✅ 不破坏现有游戏流程
- ✅ placePiece 同时处理有炸弹和无炸弹情况
- ✅ 回调机制不影响现有逻辑
- ✅ 向后兼容（无炸弹配置时游戏正常运行）

## 技术实现细节

### 爆炸流程伪代码
```
1. 消行 → clearedRows
2. bombsInRows = board.getBombPositionsInRows(clearedRows)
3. if (bombsInRows.length > 0):
4.     triggerExplosions(bombsInRows, depth=0)

triggerExplosions(positions, depth):
5.   if (depth >= maxChainDepth) return
6.   result = board.detonateAt(positions, explosionRange)
7.   触发 onBombExplosion 回调
8.   计算得分：result.affectedCells.length × 50 × (depth + 1)
9.   board.removeCellsAndApplyGravity(result.affectedCells)
10.  新消行 = board.checkLines()
11.  if (新消行.linesCleared > 0):
12.      正常消行计分
13.      新炸弹 = board.getBombPositionsInRows(新消行.clearedRows)
14.      if (新炸弹.length > 0):
15.          triggerExplosions(新炸弹, depth + 1)
16.  else if (result.chainBombs.length > 0):
17.      triggerExplosions(result.chainBombs, depth + 1)
```

### 重力下落算法
```
对每一列 x:
  从底部向上扫描
  遇到空位时，找到上方最近的非空格子
  将所有上方格子上移填充空隙
```

## 风险和注意事项

1. **无限循环风险**
   - 连锁反应必须有深度限制
   - 爆炸后必须先检测满行再检测连锁炸弹

2. **性能风险**
   - 爆炸检测可能频繁触发
   - 需要优化重力下落算法（避免嵌套循环）

3. **状态一致性**
   - 爆炸后必须保证棋盘状态一致
   - 重力下落后需要重新检测满行

4. **兼容性**
   - 无炸弹配置时，所有新代码应该不执行
   - 确保现有测试仍然通过
