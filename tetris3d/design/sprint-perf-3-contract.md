# Sprint 3 合约 - React 渲染优化 + 内存泄漏修复

## 我将构建

### 功能 3.1: Store 订阅优化
**文件**: `src/components/Game.tsx`

**优化内容**:
1. 使用 React.memo 包装纯展示组件（ScoreBoard, GameOver, TouchControls）
2. 拆分 GameScene 组件的订阅，将无关状态分离到子组件
3. 为 Game 组件使用更精确的状态选择器
4. 确保 comboCount 变化不触发 ScoreBoard 重渲染

**实现细节**:
- 将 GameScene 拆分为更小的组件（GameSceneBackground, GameSceneEffects, GameSceneBoard）
- 每个子组件只订阅自己需要的状态
- 使用 React.memo 包装所有纯展示组件
- 使用 Zustand 的 shallow 比较避免不必要的重渲染

### 功能 3.2: Effect 组件卸载清理（内存泄漏修复）
**文件**: 所有 `src/components/effects/*.tsx`

**优化内容**:
1. 为每个 effect 组件添加 useEffect cleanup 函数
2. 在 cleanup 中调用 geometry.dispose() 和 material.dispose()
3. 对 InstancedMesh 也要 dispose
4. 确保 GameBoard 的 boardMesh 和 blockGeometry 在卸载时清理

**需要清理的组件**:
- ComboFlashEffect: PlaneGeometry, MeshBasicMaterial
- ImpactRipple: RingGeometry, MeshBasicMaterial
- LineClearEffect: BoxGeometry, MeshBasicMaterial, BufferGeometry, PointsMaterial (EnhancedParticles)
- DebrisEffect: BoxGeometry, MeshStandardMaterial, InstancedMesh
- LandingBurstEffect: BufferGeometry, PointsMaterial
- ParticleSystem: BufferGeometry, PointsMaterial
- EnhancedBackground: BufferGeometry, PointsMaterial, SphereGeometry, MeshBasicMaterial
- GameBoard: BoxGeometry, MeshStandardMaterial, BufferGeometry, LineBasicMaterial, InstancedMesh

### 功能 3.3: 其他特效组件的 useFrame 优化
**文件**: `src/components/effects/ComboFlashEffect.tsx`, `src/components/effects/ImpactRipple.tsx`, `src/components/effects/LineClearEffect.tsx`

**优化内容**:
1. 检查 useFrame 中是否有对象创建，消除之
2. 共享临时变量
3. 避免每帧创建新的 THREE.Color, THREE.Vector3 等对象

**具体优化**:
- ComboFlashEffect: material.opacity 每帧修改（需要优化）
- ImpactRipple: material.opacity 每帧修改（需要优化）
- LineClearEffect: glowMeshes 中每帧创建新的 THREE.Color（需要优化）

## 验证方式

1. **React DevTools Profiler**
   - 检查 comboCount 变化时 ScoreBoard 不重渲染
   - 检查 score 变化时不会触发整个 Game 组件树重渲染
   - 检查状态变化只影响相关组件

2. **内存泄漏测试**
   - 使用 Chrome DevTools Memory 面板
   - 反复启动/停止游戏
   - 检查是否有 detached DOM 节点和 Three.js 资源
   - 长时间游玩后内存应该稳定

3. **类型检查**
   - 运行 `npx tsc --noEmit` 确保没有类型错误

4. **功能测试**
   - 游戏正常运行
   - 所有特效正常显示
   - 视觉效果与优化前一致

## 完成标准

- ✅ 所有纯展示组件使用 React.memo 包装
- ✅ GameScene 拆分为更小的组件，每个组件只订阅需要的状态
- ✅ 所有 effect 组件在 useEffect cleanup 中正确 dispose Three.js 资源
- ✅ GameBoard 组件正确清理所有资源
- ✅ useFrame 中不再创建新的 THREE 对象（使用共享的 ref）
- ✅ `npx tsc --noEmit` 通过，无类型错误
- ✅ 游戏功能正常，视觉效果不变
- ✅ 内存泄漏消除，长时间游玩内存稳定

## 不改变的内容

- 游戏逻辑和玩法
- 特效的视觉效果
- 用户界面布局
- 功能特性
