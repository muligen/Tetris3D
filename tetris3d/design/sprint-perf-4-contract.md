# Sprint 4 合约 - 性能监控与构建验证

## 我将构建

### 功能 4.1: FPS 监控面板
**文件**: `src/components/PerformanceMonitor.tsx` (新建)

1. **轻量级 FPS 计数器**
   - 使用 R3F 的 useFrame 计算实时 FPS
   - 维护最近 60 帧的时间戳历史
   - 计算当前、平均、最低 FPS

2. **显示指标**
   - 当前 FPS (实时)
   - 平均 FPS (最近 60 帧)
   - 最低 FPS (最近 60 帧)

3. **UI 设计**
   - HTML overlay (非 3D 元素，避免影响性能)
   - 位于左下角
   - 半透明黑色背景，白色文字
   - 等宽字体
   - 默认隐藏

4. **交互控制**
   - 快捷键 Ctrl+Shift+P 切换显示/隐藏
   - 使用 React state 管理可见性

5. **性能要求**
   - 开销 < 0.5ms/帧
   - 不触发 3D 场景重新渲染
   - 使用 requestAnimationFrame 的时间戳

### 功能 4.2: 集成到 Game 组件
**文件**: `src/components/Game.tsx`

1. **添加 PerformanceMonitor 组件**
   - 导入 PerformanceMonitor
   - 放置在 UI Overlay 层中，左下角
   - 使用独立的快捷键监听（不影响现有控制）

2. **键盘事件处理**
   - 在现有 keydown 事件中添加 Ctrl+Shift+P 检测
   - 使用 e.ctrlKey && e.shiftKey && e.key === 'P' 判断

### 功能 4.3: 最终构建验证
1. **类型检查**
   - 运行 `npx tsc --noEmit` 确保无类型错误
   - 修复任何类型问题

2. **构建验证**
   - 运行 `npx vite build` 确保构建成功
   - 检查构建输出和错误信息
   - 修复所有构建问题

## 验证方式

1. **功能验证**
   - 启动游戏，按 Ctrl+Shift+P，FPS 面板显示
   - FPS 数值合理（通常 30-144）
   - 平均 FPS 和最低 FPS 正确计算
   - 再次按 Ctrl+Shift+P，面板隐藏

2. **性能验证**
   - FPS 面板显示时游戏性能无明显下降
   - 面板不影响现有功能

3. **构建验证**
   - `npx tsc --noEmit` 通过
   - `npx vite build` 生成 dist/ 目录
   - 无 TypeScript 错误
   - 无构建错误

## 完成标准

- ✅ PerformanceMonitor 组件创建并正常工作
- ✅ FPS 计算准确（当前、平均、最低）
- ✅ 快捷键 Ctrl+Shift+P 切换显示/隐藏
- ✅ 面板为 HTML overlay，不影响 3D 性能
- ✅ 所有现有功能保持不变
- ✅ TypeScript 类型检查通过
- ✅ Vite 构建成功
- ✅ 代码质量达标（无硬编码、适当错误处理）

## 技术细节

### FPS 计算逻辑
```typescript
// 使用 useFrame 获取时钟信息
useFrame(({ clock }) => {
  const now = clock.getElapsedTime() * 1000;
  const delta = now - lastTime.current;
  const fps = 1000 / delta;

  // 更新帧历史（最多 60 帧）
  frameHistory.current.push(fps);
  if (frameHistory.current.length > 60) {
    frameHistory.current.shift();
  }

  lastTime.current = now;
});
```

### UI 样式
```tsx
<div style={{
  position: 'absolute',
  bottom: 8,
  left: 8,
  padding: '8px 12px',
  backgroundColor: 'rgba(0,0,0,0.7)',
  borderRadius: 4,
  color: '#0f0',
  fontFamily: 'monospace',
  fontSize: 14,
  pointerEvents: 'none',
  zIndex: 20,
}}>
  <div>FPS: {currentFps.toFixed(1)}</div>
  <div>Avg: {avgFps.toFixed(1)}</div>
  <div>Min: {minFps.toFixed(1)}</div>
</div>
```
