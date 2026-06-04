---
name: sddflow/spec
description: Generate OpenSpec docs, translate to plan-ready.md, then use writing-plans to produce the detailed implementation plan
---

# Spec: 生成规格 + 实现计划

## 目标

1. 调用 OpenSpec 生成完整规格文档（proposal.md / design.md / specs/ / tasks.md）
2. 翻译为工程视角的 `plan-ready.md`
3. 调用 Superpowers `writing-plans` skill 生成可执行的详细实现计划（`docs/superpowers/plans/YYYY-MM-DD-<变更名>.md`）

**spec 阶段产出全部文档后，build 阶段直接进入执行，不再生成计划。**

## 中断续接规则

如果用户在本阶段被打断后继续回复、补充范围、要求调整规格、或确认规格摘要，仍然停留在 spec 阶段。只更新 `openspec/changes/**`、`plan-ready.md` 和 plan 文件，不要修改任何代码或实现文件。

## 前置条件

- `openspec/changes/` 下存在活跃变更目录（由 proposal 或 brainstorming 阶段创建）
- 变更目录下至少有 `proposal.md`

---

## 步骤 1：确认活跃变更

检查 `openspec/changes/` 下是否有活跃变更（非 archive 子目录）。

没有时提示：
> "还没有活跃变更。请先用 /sddflow proposal 或 /sddflow brainstorming 创建需求。"

多个时列出并让用户选择：
> "检测到多个活跃变更：[列表]。要对哪个生成规格？"

---

## 步骤 2：生成 OpenSpec 规格文件

根据 `proposal.md` 内容生成或补齐以下文件：

| 文件 | 说明 |
|------|------|
| `openspec/changes/<变更名>/proposal.md` | 已存在，可补充 |
| `openspec/changes/<变更名>/design.md` | 技术方案 |
| `openspec/changes/<变更名>/specs/<能力>/spec.md` | 规格变更（ADDED / MODIFIED / REMOVED） |
| `openspec/changes/<变更名>/tasks.md` | 实现任务清单 |

如果 OpenSpec CLI 可用，生成后运行校验：

```bash
openspec validate <变更名> --strict
```

校验失败时修正文件后重新校验。

---

## 步骤 3：与用户确认规格

展示规格摘要，逐项确认：

> "以下是规格摘要：
> - **提案**：[proposal.md 核心内容]
> - **设计**：[design.md 核心决策]
> - **规格**：[specs/ 变更列表]
> - **任务**：[tasks.md 任务列表]
>
> 有需要调整的地方吗？"

用户确认后才进入步骤 4。

---

## 步骤 4：生成 plan-ready.md（翻译层）

将 OpenSpec 四文件翻译为工程视角的执行格式。

**翻译规则：**
1. 每个 OpenSpec Task 拆成 2-5 个细粒度步骤（对应 2-5 分钟工作量）
2. 每个步骤必须指明改哪个文件
3. 每个步骤必须有验证方式
4. **按执行依赖排序，不是按功能模块排序**
5. 记录来源路径，方便回溯

**输出路径：** `openspec/changes/<变更名>/plan-ready.md`

```markdown
# 实现计划：<变更名>

## 来源
- 提案：openspec/changes/<变更名>/proposal.md
- 设计：openspec/changes/<变更名>/design.md
- 规格：openspec/changes/<变更名>/specs/
- 任务：openspec/changes/<变更名>/tasks.md

## 实现步骤

### Task 1: <任务名>
- 目标：<做什么>
- 改动文件：<哪些文件>
- 验证方式：<怎么验证>

### Task 2: ...
```

---

## 步骤 5：生成详细实现计划

> **使用 Superpowers `writing-plans` skill**

**声明：** 输出：
> "正在使用 writing-plans skill 生成详细实现计划。"

### 5.1 输入来源

同时读取：
1. `openspec/changes/<变更名>/plan-ready.md`
2. `openspec/changes/<变更名>/tasks.md`

### 5.2 文件结构规划

拆分 Task 前，列出所有将被创建或修改的文件及其职责。每个文件只有一个清晰职责，要一起变更的文件放在同一个 Task 里。

### 5.3 Plan 文件格式

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
  // 完整测试代码，不允许占位符
  ```

- [ ] **Step 2: 运行测试，确认 FAIL**

  Run: `具体命令`
  Expected: FAIL — "[预期失败原因]"

- [ ] **Step 3: 写最小实现代码**

  ```语言
  // 完整实现代码，不允许占位符
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

### 5.4 禁止占位符

以下内容**绝对禁止**出现：
- "TBD"、"TODO"、"实现待定"、"implement later"
- "Add appropriate error handling"（需写出具体代码）
- "Write tests for the above"（需写出测试代码）
- "Similar to Task N"（直接重复代码）
- 引用了但未定义的类型、函数、方法名

### 5.5 writing-plans 自检

写完 plan 文件后执行，全部为真才允许进入步骤 6：

- [ ] `docs/superpowers/plans/` 下存在对应 `.md` 文件
- [ ] 文件中至少包含 3 个 Task
- [ ] 文件中没有 "TODO"、"TBD"、"实现待定" 字样
- [ ] 每个 Task 都有 `> **sync:**` 标注，与 tasks.md 条目一一对应
- [ ] 每个 Step 包含完整代码块（无占位符）

有任一不通过 → 回到 5.3 修复，禁止进入步骤 6。

---

## 步骤 6：汇总确认并提示

向用户展示所有产出：

> "spec 阶段完成，以下文件已就绪：
>
> **OpenSpec 规格：**
> - `openspec/changes/<变更名>/proposal.md` ✓
> - `openspec/changes/<变更名>/design.md` ✓
> - `openspec/changes/<变更名>/specs/` ✓
> - `openspec/changes/<变更名>/tasks.md` ✓
>
> **执行计划：**
> - `openspec/changes/<变更名>/plan-ready.md` ✓
> - `docs/superpowers/plans/YYYY-MM-DD-<变更名>.md` ✓
>
> 接下来可以用 `/sddflow build` 开始实现。build 会严格校验以上文件完整性后直接执行，不再重新生成计划。"

---

## 关键原则

- **一条代码都不许写** — spec 阶段只产出文档
- 只允许写 `openspec/changes/**`、`plan-ready.md`、`docs/superpowers/plans/*.md`，禁止修改任何代码
- 翻译必须在用户确认规格后自动生成，不需要用户手动触发
- writing-plans 自检必须通过，否则不允许结束 spec 阶段
- plan-ready.md 的 `## 来源` 部分必须写明路径
- 按执行依赖排序是翻译的关键步骤：先依赖后依赖方
