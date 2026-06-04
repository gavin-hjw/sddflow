---
name: sddflow/build
description: Strict pre-flight file check, then execute with subagent-driven-development + TDD
---

# Build: 执行实现

## 目标

严格校验 spec 阶段产出的所有文件完整性，通过后用 `subagent-driven-development` 逐 Task 派发子代理执行，每个子代理强制遵循 `test-driven-development` 铁律。

**build 阶段不生成任何计划文件。** 计划在 `/sddflow spec` 阶段已由 `writing-plans` 完成。

## 中断续接规则

- 被打断后继续回复、说"继续"、补充实现细节 → 保持 build 阶段，从 plan 文件的 checkbox 状态恢复
- 用户明确要求修改需求/规格/验收条件/功能边界 → **立即切到 `/sddflow amend`**，amend 完成后再回到 build

---

## 阶段 1：前置文件完整性校验

<HARD-GATE>
以下所有文件必须存在且通过校验，任何一项不通过都不允许进入执行阶段。
</HARD-GATE>

### 1.1 确定活跃变更

检查 `openspec/changes/` 下非 archive 子目录。多个时列出并让用户选择。

### 1.2 文件完整性检查

对找到的变更目录，逐项检查：

| 检查项 | 路径 | 不通过时 |
|--------|------|----------|
| 提案文件 | `openspec/changes/<变更名>/proposal.md` | 提示先运行 `/sddflow proposal` |
| 技术方案 | `openspec/changes/<变更名>/design.md` | 提示先运行 `/sddflow spec` |
| 规格目录 | `openspec/changes/<变更名>/specs/`（非空） | 提示先运行 `/sddflow spec` |
| 任务清单 | `openspec/changes/<变更名>/tasks.md` | 提示先运行 `/sddflow spec` |
| 翻译计划 | `openspec/changes/<变更名>/plan-ready.md` | 提示先运行 `/sddflow spec` |
| 详细实现计划 | `docs/superpowers/plans/` 下有 `<变更名>` 对应文件 | 提示先运行 `/sddflow spec` |

任一不通过，输出完整缺失列表后终止：

> "build 前置校验未通过，缺少以下文件：
> - [缺失文件列表]
>
> 请先完成 `/sddflow spec` 生成全部文件后再执行 build。"

### 1.3 Plan 文件内容校验

找到 plan 文件后，验证其内容质量：

| 校验项 | 规则 |
|--------|------|
| 包含 Task | 至少 1 个 `### Task N:` |
| Sync 标注 | 每个 Task 都有 `> **sync:** tasks.md →` |
| 无占位符 | 不含 "TODO"、"TBD"、"实现待定" |
| Checkbox 语法 | 存在 `- [ ]` 或 `- [x]` |

任一不通过，提示：

> "plan 文件内容校验失败：[具体原因]。请先运行 `/sddflow spec` 重新生成计划，或用 `/sddflow amend` 修订后重新生成。"

### 1.4 断点恢复判断

plan 文件通过校验后，读取其 checkbox 状态：

| 状态 | 处理 |
|------|------|
| 全部 `[x]` | 实现已完成，提示 `/sddflow close`，不再执行 |
| 部分 `[x]` | 断点恢复 — 从第一个未勾选 Task 继续（进入阶段 2） |
| 全部 `[ ]` | 全新执行（进入阶段 2） |

---

## 阶段 2：执行实现

> **使用 Superpowers `subagent-driven-development` skill**
> **每个子代理强制遵循 `test-driven-development` skill**

### 2.1 启动前准备

1. **完整读取** plan 文件一次，提取所有 Task（含完整文本）
2. 用 TodoWrite 创建任务列表，每个 Task 一条，初始状态 `[ ]`（已完成的标 `[x]`）
3. 记录变更名和相关文件路径，供子代理使用

### 2.2 逐 Task 执行

**连续执行，不在 Task 间停下来询问进度。** 唯一停止原因：BLOCKED 无法解决、真正的歧义阻塞执行、或全部完成。

```
对每个未完成 Task 按以下顺序执行：

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

### 2.3 TDD 铁律（子代理必须遵守）

每个 Step 内的代码实现按 Red-Green-Refactor 循环执行：

1. **RED** — 写失败测试，运行并确认以预期原因 FAIL
2. **GREEN** — 写最小实现代码，运行确认 PASS
3. **REFACTOR** — 清理代码，保持测试绿色

**铁律：没有先看到测试 FAIL，就没有实现代码。有代码未先写测试？删除，重来。**

### 2.4 实时 checkbox 勾选

<HARD-GATE>
每完成一个 Step，立即更新 plan 文件中对应 `- [ ]` 为 `- [x]`。
禁止等所有 Step 或所有 Task 完成后批量勾选。
</HARD-GATE>

| 时机 | 操作 |
|------|------|
| 每个 Step 完成后 | 立即修改 plan 文件，将该 Step 的 `- [ ]` 改为 `- [x]` |
| 整个 Task 所有 Step `[x]` 后 | 执行 tasks.md 同步（见 2.5） |

### 2.5 Task 完成后：同步 tasks.md

每个 Task 全部 Step 勾选完毕，立即执行：

1. 读取 plan 文件中该 Task 的 `> **sync:**` 标注，定位 tasks.md 中对应条目
2. 打开 `openspec/changes/<变更名>/tasks.md`
3. 将对应条目 `- [ ]` 改为 `- [x]`
4. 在条目末尾追加：`<!-- 已实现: [简短描述] -->`

**规则：** 整个 Task 完成才同步，不允许部分同步。`sync` 匹配不到 → 记录警告，不阻塞执行。

---

## 阶段 3：完成验证

所有 Task 执行完毕后，运行最终一致性检查：

- [ ] `openspec/changes/<变更名>/tasks.md` 所有条目为 `[x]`
- [ ] plan 文件所有 checkbox 为 `[x]`
- [ ] 两边条目数量一致

**不一致时：**

| 情况 | 处理 |
|------|------|
| tasks.md 有未勾选 | 回到阶段 2 执行遗漏 Task |
| plan 文件有未勾选 | 回到阶段 2 执行遗漏 Step |
| 数量不一致 | 重新执行 2.5 后再比对 |

全部通过后提示：

> "所有实现任务已完成，plan 文件与 tasks.md 已同步。
>
> 接下来可以用 `/sddflow close` 验证规格一致性并归档。"

---

## 关键原则

- **build 阶段不生成任何计划文件** — 计划在 spec 阶段已完成
- **build 阶段不修改规格文档** — 发现需求遗漏或规格错误 → `/sddflow amend`
- **plan-ready.md 是锁定的输入** — 子代理按计划执行，不重新解读需求
- **断点恢复依赖文件系统** — 不依赖 AI 会话记忆，任何时候重启都从 checkbox 状态恢复
- **plan 文件与 tasks.md 实时同步** — 每个 Task 完成后立即双向更新
