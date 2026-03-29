# Sprint 1 合约 - 核心 3D 渲染和基本游戏

## 我将构建

### 1. 项目初始化
- Vite + React + TypeScript 项目
- 安装 Three.js 和相关依赖
- 配置开发环境

### 2. 3D 场景搭建
- Three.js 基础设置（Scene, Camera, WebGLRenderer）
- 游戏井：10x20 网格的 3D 表示（平面 + 网格线）
- 相机定位：俯视角度，可以看到整个游戏井
- 光照系统：AmbientLight + DirectionalLight
- 渲染循环：requestAnimationFrame + 游戏循环

### 3. 方块系统
- 7 种俄罗斯方块的形状定义（I, O, T, S, Z, J, L）
- 每个方块的 3D 模型（由 4 个 1x1x1 的立方体组成）
- 不同颜色材质：
  - I: 青色 (0x00FFFF)
  - O: 黄色 (0xFFFF00)
  - T: 紫色 (0x800080)
  - S: 绿色 (0x00FF00)
  - Z: 红色 (0xFF0000)
  - J: 蓝色 (0x0000FF)
  - L: 橙色 (0xFFA500)

### 4. 游戏逻辑
- 方块生成：随机生成下一个方块
- 下落逻辑：自动下落（可配置速度）
- 移动控制：左右移动（检测边界）
- 旋转控制：顺时针旋转（检测碰撞）
- 快速下落：空格键快速下落
- 碰撞检测：墙壁、地板、已放置方块的碰撞
- 方块放置：碰撞后固定到网格上

### 5. 消除逻辑
- 检查满行：每帧检查是否有完整行
- 消除满行：移除满行并记录
- 上方下落：消除行上方的方块向下移动
- 分数计算：每行 100 分，一次消除多行有加成

### 6. 基础 UI
- 游戏容器
- 分数显示
- 键盘控制提示
- Game Over 界面

## 验证方式

### 手动测试清单

1. **3D 场景测试**
   - 启动应用
   - 预期：看到 3D 游戏井和网格
   - 预期：光照效果正确

2. **方块生成测试**
   - 观察生成的方块
   - 预期：方块形状正确
   - 预期：颜色正确

3. **控制测试**
   - 按左箭头键
   - 预期：方块向左移动
   - 按右箭头键
   - 预期：方块向右移动
   - 按上箭头键
   - 预期：方块旋转

4. **下落测试**
   - 让方块自然下落
   - 预期：方块按固定速度下落
   - 按空格键
   - 预期：方块快速下落

5. **碰撞测试**
   - 尝试移动到墙壁外
   - 预期：不能移动
   - 方块堆叠到顶部
   - 预期：游戏结束

6. **消除测试**
   - 填满一行
   - 预期：行消除
   - 预期：分数增加

## 完成标准

### 功能完整性
- ✅ 3D 场景正确渲染
- ✅ 方块可以左右移动和旋转
- ✅ 碰撞检测正确
- ✅ 行消除逻辑工作
- ✅ 分数正确计算

### 游戏体验
- ✅ 操作响应及时
- ✅ 游戏节奏合理
- ✅ 视觉反馈清晰

### 视觉设计
- ✅ 3D 场景清晰
- ✅ 方块颜色区分明显
- ✅ 光照效果合理

### 代码质量
- ✅ 代码组织清晰
- ✅ TypeScript 类型完整
- ✅ 性能可接受（60fps）

## 技术实现细节

### 项目结构
```
tetris3d/
├── src/
│   ├── components/
│   │   ├── Game.tsx           # 主游戏组件
│   │   ├── GameBoard.tsx      # 3D 游戏板组件
│   │   ├── ScoreBoard.tsx     # 分数板
│   │   └── GameOver.tsx       # 游戏结束界面
│   ├── game/
│   │   ├── TetrisGame.ts      # 游戏逻辑
│   │   ├── Piece.ts           # 方块类
│   │   ├── Board.ts           # 游戏板逻辑
│   │   └── shapes.ts         # 方块形状定义
│   ├── 3d/
│   │   ├── Scene.ts           # Three.js 场景
│   │   ├── Camera.ts         # 相机设置
│   │   ├── Lights.ts         # 光照系统
│   │   └── Renderer.ts       # 渲染器
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### 依赖项
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.90.0",
    "zustand": "^4.4.0"
  }
}
```

### 核心类设计

**Piece 类**
```typescript
- 类型：I, O, T, S, Z, J, L
- 位置：x, y
- 旋转：rotation (0-3)
- 颜色：color
- 方法：moveLeft, moveRight, rotate, getCells
```

**Board 类**
```typescript
- 网格：10x20 数组
- 方法：isValidMove, placePiece, checkLines, clearLines
```

**TetrisGame 类**
```typescript
- 当前方块：currentPiece
- 游戏板：board
- 分数：score
- 等级：level
- 状态：playing, paused, gameover
- 方法：update, handleInput, checkGameOver
```

---

**合约说明**: 这份合约定义了 Sprint 1 的完整实现计划。完成后，将拥有一个基本可玩的 3D 俄罗斯方块游戏。

请 Evaluator 审核此合约，批准后我将开始实现。
