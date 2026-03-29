# Sprint 2 合约 - 特效系统优化

## 我将构建

### 功能 2.1: DebrisEffect 对象池重构
**文件**: `src/components/effects/DebrisEffect.tsx`

**当前问题分析**:
- useFrame 中每帧清除所有子对象并重新创建（第 94-97 行）
- 每帧为每个 debris 粒子创建新的 BoxGeometry 和 MeshStandardMaterial（第 120-131 行）
- 最多 200 个 debris 粒子，每秒创建/销毁 12,000 个 Three.js 对象（60fps）
- 巨大的 GC 压力导致 4 行消除时帧率骤降

**优化方案**:
1. 使用 InstancedMesh 替代多个独立 Mesh
2. 预分配固定数量的 debris 实例（MAX_DEBRIS = 200）
3. 通过调整 instance matrix 控制位置、旋转和缩放
4. 通过 InstancedMesh 的 setColorAt 控制颜色
5. 隐藏粒子时设置 scale 为 0
6. 只在初始化时创建 geometry 和 material，后续完全复用

**实现细节**:
- 在 useMemo 中创建 InstancedMesh，使用 BoxGeometry 和 MeshStandardMaterial
- 使用 dummy Object3D 对象作为临时容器来计算矩阵
- 在 useFrame 中更新每个活动粒子的 matrix 和 color
- 使用 instanceMatrix.needsUpdate = true 和 instanceColor.needsUpdate = true 标记更新
- 保持相同的物理效果（速度、旋转、重力、淡出）

### 功能 2.2: LandingBurstEffect 粒子优化
**文件**: `src/components/effects/LandingBurstEffect.tsx`

**当前问题分析**:
- 虽然使用了 BufferGeometry，但在 useFrame 中每帧更新所有粒子的 buffer
- 每帧标记 needsUpdate = true（第 124-125 行）
- 每帧修改 material.opacity（第 128 行）
- 有优化空间但比 DebrisEffect 问题小

**优化方案**:
1. 保持现有的 BufferGeometry 方式（已经比较高效）
2. 减少不必要的 buffer 更新（只在粒子真正变化时更新）
3. 优化 material.opacity 更新逻辑
4. 考虑降低更新频率（每 2-3 帧更新一次）
5. 确保粒子在死亡后不再消耗计算资源

**实现细节**:
- 添加一个 frameCounter 来跳帧更新
- 只在有粒子存活时才更新 buffer
- 优化 material.opacity 的计算和设置
- 确保死亡粒子的位置移出视野但不触发不必要的更新

### 功能 2.3: EnhancedBackground 背景优化
**文件**: `src/components/effects/EnhancedBackground.tsx`

**当前问题分析**:
- 每帧遍历 1000 个亮星星并更新颜色（第 122-126 行）
- 直接修改 buffer 属性，每帧标记 needsUpdate = true（第 128 行）
- 闪烁效果通过乘法运算实现（colors[i] *= flicker），这会导致颜色逐渐衰减
- 3000 个星星的顶点数据每帧上传到 GPU

**优化方案**:
1. **方案 A（优先）**: 使用 ShaderMaterial 在 GPU 端实现闪烁效果
   - 创建自定义 shader，使用 time uniform 实现闪烁
   - 完全消除 CPU 端的颜色更新
   - 零 CPU 开销

2. **方案 B（备选）**: 降低更新频率
   - 每 3-5 帧更新一次星星颜色
   - 修复颜色衰减问题（应该基于原始颜色计算，而不是累乘）
   - 减少需要的更新频率

**实现细节**（方案 A）:
- 创建自定义 ShaderMaterial 替代 PointsMaterial
- Vertex shader: 传递颜色和闪烁参数
- Fragment shader: 使用 sin(time + offset) 实现闪烁
- 每个星星有随机的 phase 值来错开闪烁时间
- 保持视觉效果（闪烁频率、范围）与原版一致

## 验证方式

### 功能 2.1 验证
1. 启动游戏并触发 4 行消除
2. 观察 FPS 保持在 60 以上（当前会降到 30 以下）
3. 视觉效果与原版完全一致（粒子数量、运动轨迹、旋转、淡出）
4. 运行 Chrome DevTools Performance 分析，确认无大量对象分配
5. 验证 debris 粒子正确显示颜色和旋转
6. 验证淡出效果正常（opacity 在生命周期最后 20% 逐渐降低）

### 功能 2.2 验证
1. 方块落地时触发效果
2. 粒子运动轨迹与原版一致
3. 淡出效果正常
4. 性能分析显示 buffer 更新频率降低
5. 确认无内存泄漏

### 功能 2.3 验证
1. 启动游戏，背景星星正常显示
2. 闪烁效果自然（不过快、不过慢、不突兀）
3. CPU 占用率显著降低（通过 Performance 标签页验证）
4. 不再每帧上传颜色数据到 GPU（Three.js renderer.info 显示）
5. 长时间运行无性能下降
6. 视觉效果与原版一致或更优

## 完成标准

### 代码质量标准
- ✅ 所有 useFrame 中无 `new` 操作（对象创建）
- ✅ Geometry 和 Material 只创建一次并复用
- ✅ 无内存泄漏（正确清理资源）
- ✅ 保持现有视觉效果（外观、动画、时序）
- ✅ 不改变游戏逻辑
- ✅ TypeScript 编译通过（`npx tsc --noEmit`）
- ✅ 代码可读性良好，添加性能优化注释

### 性能标准
- ✅ DebrisEffect: 消除每帧的对象创建/销毁
- ✅ LandingBurstEffect: 减少 50% 以上的 buffer 更新
- ✅ EnhancedBackground: 消除每帧的 CPU 颜色计算和 buffer 上传
- ✅ 4 行消除时 FPS 保持在 60 以上
- ✅ 长时间游戏（10 分钟）性能稳定

### 测试标准
- ✅ 所有特效正确触发和结束
- ✅ onComplete 回调正确触发
- ✅ 多次连消效果叠加正常
- ✅ 快速游戏（快速连续操作）无性能问题
- ✅ 跨浏览器兼容性（Chrome, Firefox, Edge）

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| InstancedMesh 颜色设置可能不正确 | 充分测试 setColorAt 和 instanceColor.needsUpdate |
| Shader 闪烁效果与原版不一致 | 仔细调整 shader 参数，确保视觉效果相似 |
| 优化后效果质量下降 | 逐步实现，每步对比视觉效果 |
| TypeScript 类型错误 | 仔细处理 Three.js 的类型定义 |
| 兼容性问题 | 在多个浏览器测试 |

## 预期性能提升

- **DebrisEffect**: 消除每秒 12,000 个对象创建，GC 压力降低 95%
- **LandingBurstEffect**: Buffer 更新频率降低 50-70%
- **EnhancedBackground**: 消除每帧 1000 次颜色计算和 GPU 上传，CPU 开销降低 90%
- **整体**: 4 行消除时 FPS 从 30 提升到 60+
