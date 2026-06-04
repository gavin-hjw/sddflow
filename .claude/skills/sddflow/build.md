---
name: sddflow/build
description: Call Superpowers to execute implementation, supports checkpoint recovery
---

# Build: Superpowers 执行

## 目标

### 0. 依赖检测

执行前检查以下依赖是否可用：

| 依赖 | 检测方式 | 不可用时 |
|------|----------|----------|
| Superpowers writing-plans | 当前工具的本地或全局 skills 目录下是否存在 `writing-plans/SKILL.md` | 降级为手动拆解 plan-ready.md 中的步骤，逐条执行 |
| OpenSpec CLI | `openspec` 命令是否可执行 | 不影响 build 阶段，但 close 阶段归档需手动 mv |

如果 Superpowers 不可用，提示用户：
> "Superpowers 未安装，build 将使用手动执行模式。安装后体验更佳：请在当前工具中安装 Superpowers 插件"

如果 Superpowers 可用，调用其 `writing-plans` skill 生成详细实现计划。


### 0. 依赖检测

执行前必须**严格按以下顺序**检测依赖，**不可跳过**：

#### 0.1 检测 Superpowers writing-plans skill

按以下顺序搜索 `writing-plans/SKILL.md`，找到即停止：

1. 项目本地 skills：`<项目根>/.claude/skills/writing-plans/SKILL.md`
2. 用户全局 skills：`~/.claude/skills/writing-plans/SKILL.md`
3. 全局 plugins 缓存（仅限 Claude Code）：`~/.claude/plugins/cache/claude-plugins-official/superpowers/*/skills/writing-plans/SKILL.md`（取最高版本）

**任一路径存在即视为可用，不要只搜了一个路径就判定不可用。**

检测结果记录到表格：

| 依赖 | 检测方式 | 可用 | 不可用时 |
|------|----------|------|----------|
| Superpowers writing-plans | 按上述 3 个路径依次搜索 `writing-plans/SKILL.md` | 调用 writing-plans skill | 降级为手动模式（见下方） |
| OpenSpec CLI | `openspec` 命令是否可执行 | — | 不影响 build 阶段，但 close 阶段归档需手动 mv |

**降级模式（仅 writing-plans 确实不可用时）：**
提示用户：
> "Superpowers 未安装，build 将使用手动执行模式。安装后体验更佳：Claude Code 中执行 `/plugin install superpowers@claude-plugins-official`"

降级时仍需按 3. 中的模板手动生成 plan 文件，不可跳过文件生成直接写代码。

**正常模式（writing-plans 可用时）：**
直接调用 `writing-plans` skill，以 `plan-ready.md` 为输入生成详细实现计划。


读取 plan-ready.md，调用 Superpowers 的 writing-plans 生成详细实现计划，然后按 TDD 铁律执行。

## 中断续接规则

如果用户在 build 阶段被打断后继续回复、说"继续"、或补充实现细节，保持 build 阶段并从实现计划/checkbox 状态恢复。不要回到 proposal、brainstorming 或 spec。

如果用户明确要求修改需求、补充 spec、改变验收条件、改变功能边界或重新生成规格，停止实现并切到 `/sddflow amend`。amend 完成后再回到 `/sddflow build`。

## 前置条件

- `openspec/changes/<变更名>/plan-ready.md` 存在

如果不满足，提示：
> "还没生成 plan-ready.md。请先完成 /sddflow spec。"

## 流程

### 1. 检测状态

检查以下文件确定当前状态：

| 检查 | 怎么查 | 结果 |
|------|--------|------|
| 有活跃变更？ | `openspec/changes/` 下非 archive 子目录 | 找到变更名 |
| 有 plan-ready.md？ | 变更目录下是否存在 | 不存在→提示先 spec |
| 实现已开始？ | `docs/superpowers/plans/` 下是否有对应计划文件 | 已开始→断点恢复 |

如果有多个活跃变更，列出并让用户选择。

### 2. 断点恢复（如适用）

如果检测到已有计划文件，检查其中 checkbox 状态：

- 全部勾选 → 提示实现已完成，建议 /sddflow close
- 部分勾选 → 从未完成的 task 继续执行
- 无勾选 → 从头开始

### 3. 生成详细实现计划（必须完成后再进入步骤 4）

**此步骤不可跳过、不可省略。** 必须先产生 plan 文件，再按 plan 执行代码。

- 如果 writing-plans 可用：调用 `writing-plans` skill，以 `plan-ready.md` 为输入
- 如果降级模式：手动按下方模板拆解 plan-ready.md 中的步骤，写入 plan 文件

每个步骤要求：
- 2-5 分钟工作量
- 包含完整代码（不允许 TODO/TBD/占位符）、文件路径、验证命令
- 使用 checkbox 语法 `- [ ]` 跟踪

**Plan 文件必须保存到：**
```
docs/superpowers/plans/YYYY-MM-DD-<变更名>.md
```

**Plan 文件必须包含以下头部：**
```markdown
# [功能名称] 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [一句话描述要构建什么]

**Architecture:** [2-3 句话描述方案]

**Tech Stack:** [关键技术/库]

**来源:**
- tasks.md: openspec/changes/<变更名>/tasks.md
```

**每个 Task 必须标注对应的 tasks.md 条目**，格式如下：
```markdown
### Task N: [组件名]
> **sync:** tasks.md Task N（或 tasks.md 中对应条目的原文摘要）

**Files:**
- Create: `exact/path/to/file.py`
...
```

**自检：完成步骤 3 后，必须确认以下全部为真，才允许进入步骤 4：**
- [ ] `docs/superpowers/plans/` 目录下存在对应的 `.md` 文件
- [ ] 文件中包含 checkbox 列表（至少 3 个 task）
- [ ] 文件中没有 "TODO"、"TBD"、"实现待定" 字样
- [ ] 文件中每个 Task 都有 `> **sync:**` 标注，指向 tasks.md 中对应条目

**如果自检不通过，停留在步骤 3 修复，禁止进入步骤 4。**

### 4. 执行实现（按步骤 3 生成的 plan 文件逐条执行）

**执行前先打开步骤 3 生成的 plan 文件**，按其 checkbox 顺序逐条执行，每完成一条就勾选。

1. **TDD 铁律**：先写失败测试，再写实现代码
2. **每个 task 一个 commit**
3. 多任务可派子代理并行（参见 subagent-driven-development skill）
4. 编译/测试不通过不让提交
5. **每完成一个 step，立即勾选对应 checkbox**，不允许全部做完后批量勾选

### 5. checkbox 双向同步（每完成一个 Task 后执行）

**这是强制步骤，不可跳过。** 每完成 plan 文件中一个完整 Task（该 Task 下所有 step 已全部勾选），立即执行以下同步：

#### 5.1 Plan → tasks.md 同步

1. 读取 plan 文件中当前 Task 的 `> **sync:**` 标注，找到对应的 tasks.md 条目
2. 打开 `openspec/changes/<变更名>/tasks.md`
3. 将对应条目的 `- [ ]` 改为 `- [x]`
4. 在条目末尾追加实现摘要：`<!-- 已实现: [简短描述] -->`

**同步规则：**
- 只同步"整个 Task 已完成"的情况，不允许部分同步
- 如果 `sync` 标注匹配不到 tasks.md 中的条目，记录警告但不阻塞

#### 5.2 tasks.md → Plan 同步

1. 如果用户在 amend 阶段修改了 tasks.md 并新增了条目
2. build 恢复时检测到 tasks.md 有新增未同步条目 → 在 plan 文件中追加对应 Task
3. 如果 tasks.md 条目被删除但 plan 中对应 Task 已完成 → 不回溯；如果未完成 → 在 plan 中标记为取消

### 6. 执行完成

所有 task 完成后，提示用户：

> "所有实现任务已完成。接下来可以用 /sddflow close 验证一致性并归档。"

### 7. checkbox 同步验证（全部 Task 完成后执行）

全部 Task 完成后，执行最终一致性检查：

- [ ] 读取 `openspec/changes/<变更名>/tasks.md`，确认所有条目为 `[x]`
- [ ] 读取 `docs/superpowers/plans/YYYY-MM-DD-<变更名>.md`，确认所有 checkbox 为 `[x]`
- [ ] 两边条目数量一致（tasks.md 条目数 = plan 文件中 Task 数量）

**如果不一致：**
- tasks.md 有未勾选 → 回到步骤 4 执行遗漏的 Task
- plan 文件有未勾选 → 回到步骤 4 执行遗漏的 step
- 数量不一致 → 有人新增/删除了条目但未同步，执行步骤 5.2 后再比对

只有全部三项通过，才允许提示进入步骤 6。

## 关键原则

- **不允许在 build 阶段修改规格文档** — 发现需求遗漏或规格错误时切到 `/sddflow amend`
- build 是唯一默认允许修改代码或实现文件的阶段；如果上一阶段不是 build，不要因为用户确认范围而自动写代码
- plan-ready.md 是锁定的设计决策，Superpowers 按计划展开执行，不重新理解需求
- 断点恢复依赖文件系统状态，不依赖 AI 的会话记忆
- **plan 文件与 tasks.md 必须始终保持 checkbox 同步**，每个 Task 完成后立即双向更新
