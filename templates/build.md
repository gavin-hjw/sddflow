---
name: sddflow/build
description: Execute implementation using Superpowers writing-plans + subagent-driven-development + TDD
---

# Build: Superpowers 执行

## 目标

读取 `plan-ready.md`，用 Superpowers `writing-plans` 生成详细实现计划，再用 `subagent-driven-development` 逐 Task 派发子代理执行，每个子代理强制遵循 `test-driven-development` 铁律。

## 中断续接规则

- 被打断后继续回复、说"继续"、或补充实现细节 → 保持 build 阶段，从 plan 文件的 checkbox 状态恢复
- 用户明确要求修改需求/规格/验收条件/功能边界 → **立即切到 `/sddflow amend`**，amend 完成后再回到 build

## 前置条件

- `openspec/changes/<变更名>/plan-ready.md` 存在
- `openspec/changes/<变更名>/tasks.md` 存在

不满足时提示：
> "还没生成 plan-ready.md。请先完成 `/sddflow spec`。"

---

## 阶段 1：检测状态

检查以下文件，确定启动模式：

| 检查项 | 怎么查 | 结果 |
|--------|--------|------|
| 有活跃变更？ | `openspec/changes/` 下非 archive 子目录 | 找到变更名 |
| 有 plan-ready.md？ | 变更目录下是否存在 | 否 → 提示先 spec |
| plan 文件已存在？ | `docs/superpowers/plans/` 下有对应文件 | 是 → 断点恢复模式 |

多个活跃变更时列出并让用户选择。

### 断点恢复

如检测到已有 plan 文件，读取其中 checkbox 状态：

- 全部 `[x]` → 实现已完成，提示 `/sddflow close`
- 部分 `[x]` → 从第一个未勾选 Task 继续执行（直接进入阶段 3）
- 全部 `[ ]` → 从头开始（直接进入阶段 3，跳过阶段 2）

---

## 阶段 2：生成详细实现计划

> **使用 Superpowers `writing-plans` skill**

**声明：** 在开始前输出：
> "正在使用 writing-plans skill 生成实现计划。"

### 2.1 输入来源

同时读取以下两个文件作为计划输入：

1. `openspec/changes/<变更名>/plan-ready.md` — 翻译好的工程视角需求
2. `openspec/changes/<变更名>/tasks.md` — OpenSpec 任务清单（每个 Task 必须一一对应）

### 2.2 文件结构规划

在拆分 Task 之前，先列出所有将被创建或修改的文件及其职责。每个文件只有一个清晰的职责。将要一起变更的文件放在同一个 Task 里。

### 2.3 Plan 文件格式

**保存路径：**
```
docs/superpowers/plans/YYYY-MM-DD-<变更名>.md
```

**必须以如下 header 开头：**
```markdown
# [功能名称] 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each subagent MUST use superpowers:test-driven-development (Red-Green-Refactor cycle). Steps use checkbox (`- [ ]`) syntax for real-time tracking — check off each step IMMEDIATELY after completion, do NOT batch at the end.

**Goal:** [一句话描述要构建什么]

**Architecture:** [2-3 句话描述方案]

**Tech Stack:** [关键技术/库]

**来源:**
- plan-ready.md: openspec/changes/<变更名>/plan-ready.md
- tasks.md: openspec/changes/<变更名>/tasks.md

---
```

**每个 Task 结构：**
```markdown
### Task N: [组件名]

> **sync:** tasks.md → [对应 tasks.md 条目的原文摘要]

**Files:**
- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing:行号范围`
- Test: `tests/exact/path/to/test`

- [ ] **Step 1: 写失败测试**

  ```语言
  // 测试代码（完整，不允许占位符）
  ```

- [ ] **Step 2: 运行测试，确认 FAIL**

  Run: `具体命令`
  Expected: FAIL — "[预期失败原因]"

- [ ] **Step 3: 写最小实现代码**

  ```语言
  // 实现代码（完整，不允许占位符）
  ```

- [ ] **Step 4: 运行测试，确认 PASS**

  Run: `具体命令`
  Expected: PASS, all N tests green

- [ ] **Step 5: Refactor（如需要）**

- [ ] **Step 6: Commit**

  ```bash
  git add [文件列表]
  git commit -m "feat: [具体描述]"
  ```
```

### 2.4 禁止占位符

以下内容**绝对禁止**出现在 plan 文件中：

- "TBD"、"TODO"、"实现待定"、"implement later"
- "Add appropriate error handling"（需写出具体代码）
- "Write tests for the above"（需写出测试代码）
- "Similar to Task N"（直接重复代码）
- 引用了但未定义的类型、函数、方法名

### 2.5 自检（写完 plan 文件后必须执行）

以下全部为真才允许进入阶段 3，否则回到 2.3 修复：

- [ ] `docs/superpowers/plans/` 下存在对应的 `.md` 文件
- [ ] 文件 checkbox 列表中至少包含 3 个 Task
- [ ] 文件中没有 "TODO"、"TBD"、"实现待定" 字样
- [ ] 每个 Task 都有 `> **sync:**` 标注，与 tasks.md 条目一一对应
- [ ] 每个 Step 包含完整代码块（无占位符）

---

## 阶段 3：执行实现

> **使用 Superpowers `subagent-driven-development` skill**
> **每个子代理强制遵循 `test-driven-development` skill**

### 3.1 启动前准备

1. **完整读取** plan 文件一次，提取所有 Task（含完整文本）
2. 用 TodoWrite 创建任务列表，每个 Task 一条，初始状态 `[ ]`
3. 记录变更名和相关文件路径，供子代理使用

### 3.2 逐 Task 执行（每个 Task 完整流程）

**连续执行，不在 Task 间停下来询问进度。** 唯一停止原因：BLOCKED 无法解决、真正的歧义阻塞执行、或全部完成。

```
对每个 Task 按以下顺序执行：

┌─ 派发 Implementer 子代理 ──────────────────────────────────────┐
│  • 提供 Task 完整文本（不让子代理自己读 plan 文件）             │
│  • 提供项目上下文（相关文件路径、架构说明、技术栈）             │
│  • 明确要求：                                                   │
│    - 必须遵循 test-driven-development (Red → Verify RED         │
│      → Green → Verify GREEN → Refactor)                        │
│    - 每完成一个 Step 立即勾选 plan 文件中对应 checkbox          │
│    - 不允许先做完所有 Step 再批量勾选                           │
│  • 子代理状态：DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT        │
│    / BLOCKED                                                   │
└────────────────────────────────────────────────────────────────┘
         ↓ DONE 或 DONE_WITH_CONCERNS
┌─ 派发 Spec Reviewer 子代理 ────────────────────────────────────┐
│  • 确认代码满足 plan-ready.md 中对应需求                        │
│  • ✅ → 进入代码质量审查                                         │
│  • ❌ → Implementer 修复 → 重新 Spec 审查                        │
└────────────────────────────────────────────────────────────────┘
         ↓ ✅
┌─ 派发 Code Quality Reviewer 子代理 ────────────────────────────┐
│  • 审查代码质量（命名、结构、耦合、测试覆盖率）                 │
│  • ✅ → 勾选 plan 文件 Task checkbox → 同步 tasks.md           │
│  • ❌ → Implementer 修复 → 重新 Quality 审查                    │
└────────────────────────────────────────────────────────────────┘
```

**处理子代理状态：**

| 状态 | 处理方式 |
|------|----------|
| `DONE` | 进入 Spec 审查 |
| `DONE_WITH_CONCERNS` | 读取 concerns；正确性/范围问题先解决再审查；观察性问题记录后继续 |
| `NEEDS_CONTEXT` | 提供缺失上下文，重新派发 |
| `BLOCKED` | 提供更多上下文重试；仍阻塞则升级给用户 |

**绝不：**
- 跳过 Spec Compliance 审查
- 在 Spec 审查通过前进行 Code Quality 审查
- 让两个 Implementer 子代理同时执行（防止冲突）
- 接受"差不多符合"（reviewer 有问题 = 未完成）

### 3.3 TDD 铁律（子代理必须遵守）

每个 Step 内的代码实现必须按 Red-Green-Refactor 循环执行：

1. **RED** — 写失败测试，运行并确认以预期原因 FAIL
2. **GREEN** — 写最小实现代码，运行确认 PASS
3. **REFACTOR** — 清理代码，保持测试绿色

**铁律：没有先看到测试 FAIL，就没有实现代码。**

有代码未先写测试？删除，重来。

### 3.4 实时 checkbox 勾选规则

<HARD-GATE>
每完成一个 Step，立即更新 plan 文件中对应 `- [ ]` 为 `- [x]`。
禁止等所有 Step 或所有 Task 完成后批量勾选。
</HARD-GATE>

勾选时机：

| 时机 | 操作 |
|------|------|
| 每个 Step 完成后 | 立即修改 plan 文件，将该 Step 的 `- [ ]` 改为 `- [x]` |
| 整个 Task 所有 Step `[x]` 后 | 执行 tasks.md 同步（见 3.5） |

### 3.5 Task 完成后：同步 tasks.md

每个 Task 全部 Step 勾选完毕，立即执行：

1. 读取 plan 文件中该 Task 的 `> **sync:**` 标注，定位 tasks.md 中对应条目
2. 打开 `openspec/changes/<变更名>/tasks.md`
3. 将对应条目 `- [ ]` 改为 `- [x]`
4. 在条目末尾追加：`<!-- 已实现: [简短描述] -->`

**规则：**
- 整个 Task 完成才同步，不允许部分同步
- `sync` 匹配不到条目 → 记录警告，但不阻塞继续执行

---

## 阶段 4：完成验证

所有 Task 执行完毕后，运行最终一致性检查：

- [ ] `openspec/changes/<变更名>/tasks.md` 所有条目为 `[x]`
- [ ] `docs/superpowers/plans/YYYY-MM-DD-<变更名>.md` 所有 checkbox 为 `[x]`
- [ ] 两边条目数量一致

**不一致时：**

| 情况 | 处理 |
|------|------|
| tasks.md 有未勾选 | 回到阶段 3 执行遗漏 Task |
| plan 文件有未勾选 | 回到阶段 3 执行遗漏 Step |
| 数量不一致 | 有条目未同步，重新执行 3.5 后再比对 |

全部通过后，提示用户：

> "所有实现任务已完成，plan 文件与 tasks.md 已同步。
>
> 接下来可以用 `/sddflow close` 验证规格一致性并归档。"

---

## 关键原则

- **build 阶段不修改规格文档** — 发现需求遗漏或规格错误 → `/sddflow amend`
- **plan-ready.md 是锁定的输入** — 子代理按计划执行，不重新解读需求
- **断点恢复依赖文件系统** — 不依赖 AI 会话记忆，任何时候重启都从 checkbox 状态恢复
- **plan 文件与 tasks.md 实时同步** — 每个 Task 完成后立即双向更新
- **不允许进入 build 阶段修改代码前跳过 plan 生成** — 必须先有 plan 文件
