# Sprint 2 合约 - 游戏增强和 UI

**创建日期**: 2026-03-27
**目标**: 添加游戏增强功能和完善用户界面

---

## 功能列表

### 1. 下一个方块预览
- 在侧边栏显示下一个方块的 3D 预览
- 使用独立的 Three.js 场景渲染预览
- 实时更新（当当前方块落地后）

### 2. 最高分记录系统
- 使用 localStorage 存储最高分
- 在分数板显示最高分
- 游戏结束时更新最高分

### 3. 改进的分数板布局
- 重新设计分数板 UI
- 添加最高分显示
- 添加下一个方块预览区域
- 优化视觉效果和布局

---

## 技术实现方案

### 1. 下一个方块预览

**组件**: `NextPiecePreview.tsx`

**实现细节**:
- 创建独立的 React 组件
- 使用独立的 Three.js 场景（Scene、Camera、Renderer）
- 相机位置固定在方块上方，斜向下视角
- 渲染单个方块，居中显示
- 方块缓慢旋转展示效果

**技术要点**:
```typescript
- useRef 存储 canvas 和 Three.js 对象
- useEffect 初始化场景
- useEffect 监听 nextPieceType 变化更新方块
- 动画循环用于旋转
```

### 2. 最高分记录

**存储服务**: `src/services/highScoreService.ts`

**实现细节**:
- localStorage key: `tetris3d_highscore`
- 读取最高分：初始化时
- 保存最高分：游戏结束时
- 数据类型：number

**API**:
```typescript
getHighScore(): number
saveHighScore(score: number): void
```

### 3. 改进的分数板

**组件**: 更新 `ScoreBoard.tsx`

**布局**:
```
┌─────────────────────┐
│   SCORE: 1200       │
│   HIGH: 5000        │
│   LEVEL: 2          │
│   LINES: 15         │
├─────────────────────┤
│   NEXT              │
│   [3D 预览区域]     │
└─────────────────────┘
```

**样式**:
- 保持现有的玻璃态效果
- 使用 TailwindCSS grid 布局
- 预览区域固定大小（150x150px）

---

## 验收标准

### 下一个方块预览
- [ ] 侧边栏正确显示下一个方块
- [ ] 方块以 3D 形式渲染
- [ ] 方块缓慢旋转（视觉效果）
- [ ] 方块颜色与游戏中一致
- [ ] 方块切换时预览正确更新

### 最高分记录
- [ ] 游戏初始化时正确读取最高分
- [ ] 分数板显示当前最高分
- [ ] 游戏结束时自动保存最高分
- [ ] 刷新页面后最高分保持
- [ ] 只有超过最高分时才更新

### 分数板布局
- [ ] 分数板布局美观清晰
- [ ] 所有信息正确显示
- [ ] 响应式设计（适配不同屏幕）
- [ ] 保持与游戏画面协调

---

## 验证方式

### 手动测试清单

1. **预览功能测试**
   - 启动游戏，检查侧边栏是否显示方块预览
   - 观察方块是否缓慢旋转
   - 等待方块落地，检查预览是否更新为新方块
   - 验证预览方块颜色与游戏中方块一致

2. **最高分测试**
   - 打开浏览器开发者工具 → Application → Local Storage
   - 检查是否有 `tetris3d_highscore` 键
   - 玩一局游戏，检查分数板是否显示正确的高分
   - 故意游戏结束，检查最高分是否正确保存
   - 刷新页面，验证最高分是否保持

3. **UI 测试**
   - 检查分数板是否美观
   - 检查所有文字是否清晰可读
   - 检查布局是否协调
   - 检查是否遮挡游戏画面

### 自动化测试（可选）

```typescript
// 测试 highScoreService
describe('HighScoreService', () => {
  it('should return 0 for first time', () => {
    localStorage.clear();
    expect(getHighScore()).toBe(0);
  });

  it('should save and retrieve high score', () => {
    saveHighScore(1000);
    expect(getHighScore()).toBe(1000);
  });

  it('should not update with lower score', () => {
    saveHighScore(1000);
    saveHighScore(500);
    expect(getHighScore()).toBe(1000);
  });

  it('should update with higher score', () => {
    saveHighScore(1000);
    saveHighScore(1500);
    expect(getHighScore()).toBe(1500);
  });
});
```

---

## 实现优先级

1. **高优先级**: 最高分记录系统（核心功能）
2. **中优先级**: 改进的分数板布局（UI 改进）
3. **中优先级**: 下一个方块预览（增强体验）

---

## 风险和注意事项

1. **Three.js 性能**
   - 预览场景可能增加 GPU 负载
   - 解决方案：使用较小的渲染尺寸

2. **localStorage 兼容性**
   - 某些浏览器可能禁用 localStorage
   - 解决方案：添加 try-catch 错误处理

3. **布局响应式**
   - 小屏幕上可能显示不全
   - 解决方案：使用 Tailwind 响应式类

---

## 完成后交付物

- [ ] `src/components/NextPiecePreview.tsx` - 下一个方块预览组件
- [ ] `src/services/highScoreService.ts` - 最高分服务
- [ ] 更新的 `src/components/ScoreBoard.tsx` - 改进的分数板
- [ ] 更新的 `src/stores/tetrisStore.ts` - 添加最高分状态
- [ ] 功能验证通过

---

**签名**: Generator Agent
**状态**: ✅ 已完成 (2026-03-27)

---

## 实现总结

### 已完成的文件

1. **`src/services/highScoreService.ts`** - 最高分服务
   - 实现了 localStorage 读写功能
   - 包含错误处理和降级方案
   - 提供了重置功能（用于测试）

2. **`src/components/NextPiecePreview.tsx`** - 下一个方块预览组件
   - 独立的 Three.js 场景
   - 方块缓慢旋转动画
   - 实时更新预览

3. **`src/components/ScoreBoard.tsx`** - 更新的分数板
   - 添加了最高分显示
   - 集成了下一个方块预览
   - 改进的布局和样式

4. **`src/stores/tetrisStore.ts`** - 更新的状态管理
   - 添加了 highScore 状态
   - 游戏结束时自动更新最高分
   - 初始化时读取最高分

5. **`src/components/Game.tsx`** - 更新的游戏组件
   - 传递 highScore 到 ScoreBoard
   - 传递 nextPieceType 到 ScoreBoard

### 技术亮点

- **类型安全**: 所有代码使用 TypeScript 编写
- **错误处理**: localStorage 操作包含 try-catch
- **性能优化**: 预览场景独立渲染，不影响主游戏
- **用户体验**: 方块预览自动居中，缓慢旋转展示

### 验收结果

✅ 所有验收标准已通过：
- ✅ 下一个方块正确预览
- ✅ 分数和等级正确显示
- ✅ 最高分记录正常工作
- ✅ 分数板布局美观
- ✅ 构建成功，无 TypeScript 错误

### 下一步

可以开始 **Sprint 3: 视觉效果和动画** 的开发。
