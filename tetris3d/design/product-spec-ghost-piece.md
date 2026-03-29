# Tetris 3D - Ghost Piece (瞄准线) 产品规格

## 概述

### 项目描述
为 Tetris 3D 游戏添加 Ghost Piece 功能，在游戏板上以半透明形式显示当前方块硬降后的落点位置，帮助玩家更准确地预判方块落点，提升游戏体验和策略性。

### 目标用户
- 所有 Tetris 3D 玩家，尤其是中高级玩家
- 希望提高精确放置能力的玩家

### 核心价值
- 减少"猜落点"的挫败感
- 提升游戏的策略深度
- 符合现代 Tetris 游戏的标准体验

---

## 技术栈

### 现有技术
- **前端**: React + TypeScript + Three.js (React Three Fiber)
- **状态管理**: Zustand (tetrisStore)
- **游戏逻辑**: 纯 TypeScript 类 (Piece, Board, TetrisGame)

### Ghost Piece 实现技术
- **渲染**: Three.js MeshStandardMaterial (半透明)
- **几何体**: 复用现有 `pieceGeometry`
- **计算**: 基于现有 `Board.isValidPosition()` 方法

---

## 功能分解

### Sprint 1: Ghost Piece 核心功能

**目标**: 实现完整的 Ghost Piece 预览功能

#### 功能 1: Ghost Piece 位置计算

**文件**: `src/game/TetrisGame.ts`

**新增方法**:
```typescript
/**
 * 获取当前方块硬降后的落点位置
 * @returns Ghost Piece 的单元格坐标数组，如果没有当前方块则返回 null
 */
getGhostCells(): number[][] | null {
  if (!this.currentPiece) return null;

  // 克隆当前方块
  const ghost = this.currentPiece.clone();

  // 模拟硬降：持续下落直到位置无效
  while (true) {
    ghost.moveDown();
    const cells = ghost.getCells();
    if (!this.isValidPositionForCells(cells)) {
      ghost.moveUp(); // 回退到最后有效位置
      return ghost.getCells();
    }
  }
}

/**
 * 检查给定单元格位置是否有效（复用现有逻辑）
 */
private isValidPositionForCells(cells: number[][]): boolean {
  return cells.every(([x, y]) => {
    if (x < 0 || x >= 10 || y < 0 || y >= 20) return false;
    const grid = this.board.getGrid();
    return grid[y][x] === null;
  });
}
```

**验收标准**:
- Ghost 位置与实际硬降落点完全一致
- 当方块旋转或移动时，Ghost 位置实时更新
- 边界情况正确处理（方块在顶部、底部、边缘）

---

#### 功能 2: Ghost Piece 3D 渲染

**文件**: `src/components/GameBoard.tsx`

**实现方案**:

1. **在 GameBoard 组件中添加 Ghost Piece 渲染逻辑**

在 `useFrame` 钩子中，与当前方块渲染并列添加 Ghost Piece：

```typescript
// 在 currentPiece 渲染代码后添加

// 2. 更新 Ghost Piece 位置
let ghostGroup = meshRef.current.children.find(
  c => c.userData?.isGhostPiece
) as THREE.Group | undefined;

if (currentPiece) {
  // 从 tetrisStore 获取 ghostCells，或通过 props 传入
  const ghostCells = getGhostCells(); // 需要从 TetrisGame 获取
  const color = currentPiece.getColor();

  if (!ghostGroup) {
    ghostGroup = new THREE.Group();
    ghostGroup.userData.isGhostPiece = true;
    meshRef.current.add(ghostGroup);
  }

  // 创建半透明材质
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.25,  // 半透明
    roughness: 0.1,
    metalness: 0.3,
    emissive: color,
    emissiveIntensity: 0.1,
    wireframe: false,  // 可选：设为 true 显示线框风格
  });

  // 或者使用线框风格（可选）
  const ghostWireframeMaterial = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  });

  // 更新 Ghost Piece 方块数量和位置
  while (ghostGroup.children.length > ghostCells.length) {
    ghostGroup.remove(ghostGroup.children[ghostGroup.children.length - 1]);
  }
  while (ghostGroup.children.length < ghostCells.length) {
    ghostGroup.add(new THREE.Mesh(pieceGeometry, ghostMaterial));
  }

  // 更新位置
  ghostCells.forEach(([x, y], i) => {
    const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
    const mesh = ghostGroup!.children[i] as THREE.Mesh;
    mesh.position.set(
      x * BLOCK_SIZE + BLOCK_SIZE / 2,
      flippedY,
      BLOCK_SIZE * 0.25  // 略微靠后，避免与当前方块重叠
    );
    mesh.material = ghostMaterial;
  });
} else if (ghostGroup) {
  meshRef.current.remove(ghostGroup);
}
```

2. **通过 tetrisStore 传递 Ghost 数据**

**文件**: `src/stores/tetrisStore.ts`

在 store 中添加 ghostCells 状态：

```typescript
interface TetrisState {
  // ... 现有状态
  ghostCells: number[][] | null;
  setGhostCells: (cells: number[][] | null) => void;
}

// 在实现中
ghostCells: null,
setGhostCells: (cells) => set({ ghostCells: cells }),
```

3. **在 TetrisGame 中更新 Ghost 状态**

在每次可能改变方块位置的操作后调用：

```typescript
// 在 moveLeft, moveRight, rotate, spawnNewPiece 后
this.updateGhost();

private updateGhost(): void {
  if (this.onGhostUpdate) {
    this.onGhostUpdate(this.getGhostCells());
  }
}
```

**验收标准**:
- Ghost Piece 以半透明形式正确显示在落点位置
- Ghost Piece 颜色与当前方块一致
- 半透明度适中（约 0.2-0.3），既可见又不遮挡视线
- Ghost Piece 不影响游戏性能（FPS 无明显下降）
- 当没有当前方块时，Ghost Piece 消失

---

#### 功能 3: 视觉优化

**可选渲染风格**:

1. **半透明实心方块** (推荐)
   - opacity: 0.25
   - 复用 pieceGeometry
   - 与当前方块使用相同颜色

2. **线框风格** (备选)
   - wireframe: true
   - opacity: 0.4
   - 更明显的轮廓效果

3. **边缘高亮** (高级)
   - 使用 EdgesGeometry 添加边缘线
   - 半透明填充 + 边缘线组合

**验收标准**:
- Ghost Piece 与当前方块有明显视觉区分
- 在各种背景颜色下都清晰可见
- 不会与已放置方块混淆

---

## 验收标准

### 功能完整性
- [ ] Ghost Piece 在所有移动操作后正确更新位置
- [ ] Ghost Piece 在旋转后正确更新位置
- [ ] Ghost Piece 与实际硬降落点 100% 一致
- [ ] 边界情况处理正确（游戏结束、暂停等）

### 用户体验
- [ ] 用户能清晰区分 Ghost Piece 和当前方块
- [ ] Ghost Piece 不遮挡已放置方块
- [ ] 半透明度适中，不影响视线判断
- [ ] 视觉风格与游戏整体设计一致

### 性能
- [ ] 无 FPS 明显下降
- [ ] 复用现有几何体（pieceGeometry）
- [ ] Ghost 计算不影响游戏逻辑性能

### 代码质量
- [ ] 复用现有 isValidPosition 逻辑
- [ ] 无硬编码值
- [ ] 适当的错误处理（无 currentPiece 时返回 null）
- [ ] TypeScript 类型正确

---

## 实现优先级

1. **P0 (必须)**: 基础 Ghost Piece 计算和渲染
2. **P1 (应该)**: 视觉优化和风格调整
3. **P2 (可选)**: 线框风格、边缘高亮等高级效果

---

## 技术注意事项

1. **Z-Index 处理**: Ghost Piece 应渲染在已放置方块之后，当前方块之前
2. **避免重复计算**: 每帧重新计算 Ghost 位置（开销很小，保证实时性）
3. **材质复用**: 考虑缓存 Ghost Material 避免每帧创建
4. **坐标系统**: 确保与现有 Y 轴翻转逻辑一致

---

## 完成定义

当以下条件全部满足时，功能被视为完成：

1. Ghost Piece 准确显示硬降落点位置
2. 所有移动和旋转操作后实时更新
3. 半透明视觉效果清晰且不干扰游戏
4. 无性能下降
5. 代码通过类型检查
6. 在各种游戏模式下正常工作
