# Sprint 1 合约 - 关键渲染路径优化

## 我将构建

### 功能 1.1: GameBoard InstancedMesh 缓存重构
**文件**: `src/components/GameBoard.tsx`

**实现描述**:
1. **提取共享几何体和材质为单例缓存**
   - 将 BoxGeometry 提取为组件级别 useMemo 单例
   - 为每种颜色预创建并缓存 MeshStandardMaterial
   - 避免每次调用 createPlacedPiecesMesh 时创建新对象

2. **预分配 InstancedMesh 并增量更新**
   - 预分配最大容量（200 个方块）的 InstancedMesh
   - 使用 `setMatrixAt` 和 `instanceMatrix.needsUpdate = true` 更新
   - 保持一个颜色映射表，追踪每个颜色的 InstancedMesh 实例
   - 当方块数量增加时扩展，减少时不重新分配

3. **Squash 动画只更新受影响方块**
   - 跟踪哪些方块在动画中（通过 squashAnimRef）
   - 只对这些方块的 instance matrix 进行更新
   - 不在动画中的方块保持不变
   - 动画结束后一次性重置所有矩阵

4. **复用临时数学对象**
   - 创建组件级别的 Vector3、Quaternion、Matrix4 对象池
   - 在 useFrame 中复用这些对象，避免每帧 new

### 功能 1.2: 消除 useFrame 中的对象创建
**文件**: `src/components/GameBoard.tsx`

**实现描述**:
1. **提取当前方块材质到 ref**
   - 创建 `currentPieceMaterialRef` 存储 MeshStandardMaterial
   - 使用 `material.color.set(color)` 更新颜色而非创建新材质
   - 避免第 259 行每帧创建新材质

2. **复用临时变量**
   - 将 position、scale 等临时变量提取到组件级别
   - 在 useFrame 中复用这些变量

### 功能 1.3: 状态更新优化
**文件**: `src/stores/tetrisStore.ts`

**实现描述**:
1. **移除 update() 中的无条件 triggerUpdate()**
   - 删除第 383 行的 `get().triggerUpdate()` 调用
   - 3D 场景完全由 useFrame 驱动，不需要 React 重渲染

2. **只在游戏事件时触发 version 更新**
   - 方块放置（已在 triggerLandingImpact 中处理）
   - 行消除（已在 triggerLineClearEnhanced 中处理）
   - 游戏结束（已在 setOnGameOver 回调中处理）
   - 用户操作（moveLeft、rotate 等）保持现有 triggerUpdate()

3. **确保 3D 渲染不依赖 React 重渲染**
   - GameBoard 的 useFrame 直接读取 store 中的游戏状态
   - 不依赖 version 变化来触发渲染

## 验证方式

### 功能 1.1 验证
1. 启动游戏，放置多个方块
2. 每次方块落地时，使用 Chrome DevTools Memory 面板观察：
   - 不应看到大量 BoxGeometry 和 MeshStandardMaterial 对象创建
   - 内存分配应显著减少
3. 观察 Squash 动画期间 FPS 保持在 90 以上
4. 使用 React DevTools Profiler 确认没有不必要的重渲染

### 功能 1.2 验证
1. 启动游戏并移动当前方块
2. 在 Chrome DevTools Performance 面板录制 5 秒
3. 检查 Recording 中的 Memory allocations：
   - 不应看到每帧创建新的 MeshStandardMaterial
   - 材质对象数量应保持稳定

### 功能 1.3 验证
1. 启动游戏，观察方块自然下落（不操作）
2. 使用 React DevTools 查看组件渲染次数
3. 静止状态下不应触发 GameBoard 组件重渲染
4. 只在移动、旋转、放置等操作时触发重渲染

### 综合验证
1. 运行 `npx tsc --noEmit` 确保类型检查通过
2. 实际游戏 5 分钟，确认：
   - 所有功能正常（方块移动、旋转、消除、动画）
   - FPS 稳定在 60 以上
   - 无内存泄漏迹象

## 完成标准

- ✅ GameBoard.tsx 不再在 createPlacedPiecesMesh 中创建新的 geometry/material
- ✅ Squash 动画期间只更新受影响方块的 matrix
- ✅ useFrame 中不创建新的 THREE 对象（geometry、material、Vector3）
- ✅ tetrisStore 的 update() 不再无条件触发 version 更新
- ✅ 3D 渲染完全由 useFrame 驱动，不依赖 React 重渲染
- ✅ 所有现有功能保持不变（游戏逻辑、视觉效果）
- ✅ TypeScript 类型检查通过（`npx tsc --noEmit`）
- ✅ 代码无硬编码值（使用现有常量）
- ✅ 适当的代码注释说明优化原理
