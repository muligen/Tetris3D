---
name: team
description: 协调 Planner、Generator、Evaluator 三个 Agent 完成产品开发
---

# Team Coordination Skill

使用三个专业化的 Agent 协作完成产品开发，模拟真实团队的工作流程。

## Agent 角色

1. **Planner** (Opus 4.6): 产品规划，将需求扩展为完整规格
2. **Generator** (Sonnet 4.6): 功能实现，按合约构建应用
3. **Evaluator** (Opus 4.6): 质量保证，测试并提供反馈

## 使用方式

### 第一次使用（开始新项目）

```
/team
```

系统会引导你：
1. 描述你想构建的产品（1-4 句话）
2. Planner 会创建完整的产品规格
3. 逐个 Sprint 完成开发

### 继续现有项目

```
/team --continue
```

从上次停止的地方继续工作。

## 工作流程

```
┌─────────────┐
│   用户需求   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Planner   │ ← 创建产品规格
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│         Sprint 循环                   │
│  ┌──────────┐      ┌──────────┐     │
│  │Generator │◄────►│Evaluator │     │
│  │  提议合约 │      │  审核合约 │     │
│  └────┬─────┘      └──────────┘     │
│       │                               │
│       ▼                               │
│  ┌──────────┐      ┌──────────┐     │
│  │Generator │─────►│Evaluator │     │
│  │  实现功能 │      │  测试反馈 │     │
│  └──────────┘      └──────────┘     │
│       │                │             │
│       └────────────────┘             │
│              │                       │
│         通过？❌────┐                │
│              │     │                │
│         通过 ✅     │                │
└──────────────┼─────┘                │
               │                      │
               ▼                      │
          下一个 Sprint ◄─────────────┘
```

## 文件结构

```
design/
├── product-spec.md              # 产品规格（Planner 生成）
├── sprint-1-contract.md         # Sprint 1 合约（Generator 提议）
├── sprint-1-contract-review.md  # 合约审核（Evaluator 反馈）
├── sprint-1-self-assessment.md  # 自我评估（Generator）
├── sprint-1-evaluation.md       # 评估报告（Evaluator）
└── ...                         # 其他 Sprint

src/                             # 源代码（Generator 生成）
```

## Agent 协作协议

### Planner → Generator
- 输入: 产品规格文档
- 内容: 功能列表、技术栈、验收标准
- 期望: Generator 逐个 Sprint 实现

### Generator → Evaluator
阶段 1: 合约提议
- 输入: Sprint 合约文档
- 内容: 将构建什么、如何验证
- 期望: Evaluator 审核并批准

阶段 2: 功能实现
- 输入: 完成的代码和自我评估
- 内容: 实现的功能、测试结果
- 期望: Evaluator 测试并评分

### Evaluator → Generator
- 输入: 评估报告
- 内容: 问题列表、改进建议
- 期望: Generator 修复问题

## 当前进度追踪

系统自动追踪当前状态：
- `PLANNING`: Planner 正在创建规格
- `SPRINT_CONTRACT`: Generator 提议合约，Evaluator 审核
- `SPRINT_IMPLEMENT`: Generator 正在实现
- `SPRINT_REVIEW`: Evaluator 正在测试
- `COMPLETE`: 所有 Sprint 完成

## 注意事项

1. **质量优先**: 不赶进度，确保每个 Sprint 达到标准
2. **迭代改进**: 评估不通过时，Generator 需要修复并重新提交
3. **用户决策**: 关键决策点会询问用户意见
4. **进度可见**: 每个 Sprint 完成后可以看到进度更新

## 示例

```
你: /team

系统: 让我们开始！你想构建什么产品？
      用 1-4 句话描述你的想法。

你: 一个待办事项应用，可以添加删除任务，
      标记完成，数据保存到本地。

系统: 好的！Planner 正在创建产品规格...
      [Planner 工作...]

      产品规格已创建！包含 3 个 Sprint：
      - Sprint 1: 基础任务管理
      - Sprint 2: 任务分类和筛选
      - Sprint 3: 数据导入导出

      准备开始 Sprint 1。Generator 正在提议合约...
      [Generator 和 Evaluator 协作...]

      Sprint 1 ✅ 完成！
      Sprint 2 进行中...
```

## 高级选项

### 从特定 Sprint 开始
```
/team --sprint 2
```

### 跳过评估（不推荐）
```
/team --fast
```

### 查看当前状态
```
/team --status
```
