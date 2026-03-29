# 3D 俄罗斯方块 🎮

一个基于 Three.js 的 3D 俄罗斯方块游戏，将经典玩法与现代 3D 图形完美结合。

![版本](https://img.shields.io/badge/version-1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Three.js](https://img.shields.io/badge/Three.js-r160-blue)

## ✨ 功能特性

### 核心游戏
- 7 种经典俄罗斯方块（I, O, T, S, Z, J, L）
- 方块旋转、移动、快速下落
- 碰撞检测和边界检测
- 满行消除和分数计算
- 等级系统（每 10 行升级）
- 难度递增（速度随等级增加）

### 3D 视觉效果
- Three.js 3D 渲染
- 彩色方块（7 种颜色）
- 星空背景（多层动态星星）
- 光照和阴影系统
- 粒子消除特效
- 屏幕震动反馈
- 增强背景氛围

### 用户界面
- 分数板（SCORE、HIGH、LEVEL、LINES）
- 下一个方块预览（3D 独立场景）
- 最高分记录（localStorage 持久化）
- 暂停/继续功能
- 游戏结束界面
- 重新开始功能

### 音效系统
- 移动音效
- 旋转音效
- 下落音效
- 消除音效（根据消除行数不同旋律）
- Web Audio API 实现

### 控制方式
- 键盘控制（←→↑↓ 空格）
- P 键暂停/继续
- R 键重新开始
- 触摸控制（移动端）
- 游戏手柄支持

### 游戏模式
- CLASSIC: 经典模式
- TIMED: 限时模式（2分钟）
- ZEN: 禅模式（无游戏结束）

## 🛠️ 技术栈

- React 18 + TypeScript
- Vite
- Three.js + @react-three/fiber + @react-three/drei
- Zustand (状态管理)
- Web Audio API
- Playwright (测试)

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:5175

### 生产构建
```bash
npm run build
```

### 运行测试
```bash
npx playwright test
```

## 🎯 控制方式

### 键盘控制
- **←/→**: 左右移动
- **↑**: 旋转
- **↓/空格**: 快速下落
- **P**: 暂停/继续
- **R**: 重新开始

### 触摸控制（移动端）
- **← →**: 左右移动
- **↻**: 旋转
- **↓**: 快速下落
- **⏸**: 暂停

## 📁 项目结构

```
src/
├── components/          # React 组件
│   ├── Game.tsx         # 主游戏组件
│   ├── GameBoard.tsx    # 3D 游戏板
│   ├── ScoreBoard.tsx   # 分数板
│   ├── GameOver.tsx     # 游戏结束
│   ├── NextPiecePreview.tsx  # 下一个方块预览
│   ├── TouchControls.tsx     # 触摸控制
│   ├── Leaderboard.tsx       # 排行榜
│   ├── ModeSelector.tsx       # 模式选择
│   └── effects/         # 视觉特效
│       ├── ParticleSystem.tsx    # 粒子系统
│       ├── LineClearEffect.tsx   # 消除特效
│       └── EnhancedBackground.tsx # 增强背景
├── game/               # 游戏逻辑
│   ├── TetrisGame.ts   # 游戏主类
│   ├── Piece.ts        # 方块类
│   ├── Board.ts        # 游戏板
│   ├── shapes.ts       # 方块形状
│   └── GameMode.ts     # 游戏模式
├── services/           # 服务层
│   ├── highScoreService.ts   # 最高分服务
│   ├── audioService.ts        # 音效服务
│   ├── leaderboardService.ts # 排行榜服务
│   └── gamepadService.ts      # 手柄服务
├── hooks/              # 自定义 Hooks
│   ├── useAnimation.ts        # 动画钩子
│   └── useScreenShake.ts      # 屏幕震动钩子
├── stores/             # 状态管理
│   └── tetrisStore.ts  # Zustand store
└── utils/              # 工具函数
    └── animation.ts    # 动画工具
```

## 🎊 开发历程

本项目采用 4 个 Sprint 迭代开发：

| Sprint | 内容 | 状态 |
|--------|------|------|
| Sprint 1 | 核心 3D 渲染和基本游戏 | ✅ 完成 |
| Sprint 2 | 游戏增强和 UI | ✅ 完成 |
| Sprint 3 | 视觉效果和动画 | ✅ 完成 |
| Sprint 4 | 优化和打磨 | ✅ 完成 |

## 📄 许可证

MIT License

## 🙏 致谢

- Three.js 社区
- React Three Fiber 团队
- Zustand 状态管理库
- 所有开源贡献者

---

**享受游戏！** 🎮✨
