# @gavin-hjw/sddflow

[English](./README.md)

## 介绍

sddflow 是 OpenSpec + Superpowers 的工作流协调器，把「需求与设计 → 规格文档 → 代码实现 → 验证归档」串成一条可续接的流程，消除需求规格与工程执行之间的格式鸿沟。

**使用前必须完成两件事：**

1. **安装依赖** — OpenSpec CLI、Superpowers 插件及其 6 个必需 skills（见下方「依赖」）
2. **初始化项目** — 在目标项目目录执行 `sddflow init`，检测依赖、运行 `openspec init`，并在 AI 工具中生成 sddflow skills

初始化完成前，AI 工具里无法使用 `/sddflow` 工作流。每个项目只需 init 一次；升级 sddflow 包后运行 `sddflow update` 重新生成 skills 即可。

## 安装

```bash
npm install -g @gavin-hjw/sddflow
```

在项目目录初始化：

```bash
cd your-project
sddflow init --tools claude
```

支持的工具：`claude`、`codex`、`cursor`、`opencode`（逗号分隔，如 `--tools claude,cursor`）。

安装到全局 skills 目录（所有项目共用）：

```bash
sddflow init --tools claude --global
```

升级 npm 包后，在项目目录重新生成 skills：

```bash
sddflow update
```

可用 `sddflow status` 查看依赖是否就绪、OpenSpec 是否初始化完整，以及当前活跃变更处于哪个阶段。

## 依赖

`sddflow init` 会逐项检测，任一缺失则中止并给出安装指引。

| 依赖 | 作用 | 安装方式 |
|------|------|----------|
| **OpenSpec CLI** | 生成与管理结构化规格 | `npm install -g @fission-ai/openspec@latest` |
| **OpenSpec Skill 集成** | 在 AI 工具中调用 OpenSpec 流程 | 由 `sddflow init` 自动执行 `openspec init --tools <tools>` |
| **Superpowers 插件** | 实现计划与 build 阶段执行 | Claude Code：`/plugin install superpowers@claude-plugins-official`；Cursor：Settings → Plugins → superpowers |

Superpowers 还需具备以下 6 个 skills：`brainstorming`、`writing-plans`、`subagent-driven-development`、`test-driven-development`、`verification-before-completion`、`finishing-a-development-branch`。

## 工作流

在 AI 工具中按顺序执行。规范调用方式为 `/sddflow <阶段>`；也可输入 `/sddflow` 让系统根据当前变更状态自动路由。

Claude / Codex / Cursor 提供阶段别名（如 `/sddflow-brainstorming`）；OpenCode 使用 `/sddflow/brainstorming` 等形式。

```
brainstorming → spec → build → close
                  ↑      │
                  └── amend（需求变更时，按需插入）
```

---

### 第一步：brainstorming — 需求与设计探索

**你做什么**

1. 在 AI 工具中输入 `/sddflow brainstorming`，描述你想做的变更
2. 回答 AI 的追问（目的一次只问一个）：用户场景、约束、方案取舍、边界、验收标准
3. 阅读 AI 提出的 2–3 种方案，选定方向
4. 逐段确认设计（架构、数据流、错误处理等），最后明确回复「确认」

**产出**

- `openspec/changes/<变更名>/proposal.md`

**你需要检查**

- [ ] `openspec/changes/<变更名>/` 目录已创建
- [ ] `proposal.md` 内容与你确认的设计一致：背景、场景、方案、范围边界、验收标准
- [ ] 此阶段**不应**出现任何代码改动

**通过后** → 进入第二步

---

### 第二步：spec — 生成规格与实现计划

**你做什么**

1. 输入 `/sddflow spec`
2. 若存在多个活跃变更，告诉 AI 要对哪一个生成规格
3. 阅读 AI 展示的规格摘要（提案、设计、specs、tasks），确认或提出修改
4. 确认后等待 AI 完成 OpenSpec 制品、翻译层和详细实现计划

**产出**

- `openspec/changes/<变更名>/specs/`（规格 delta）
- `openspec/changes/<变更名>/tasks.md`
- `openspec/changes/<变更名>/design.md`（按需，非必须）
- `openspec/changes/<变更名>/plan-ready.md`（工程视角翻译）
- `docs/superpowers/plans/YYYY-MM-DD-<变更名>.md`（详细实现计划）

**你需要检查**

- [ ] `openspec validate <变更名> --strict` 通过（AI 应已执行，你可自行复验）
- [ ] `specs/` 非空，`tasks.md` 存在
- [ ] `plan-ready.md` 与 `docs/superpowers/plans/` 下计划文件均存在
- [ ] 三份任务文档（`tasks.md`、`plan-ready.md`、superpowers plan）中任务项均含 `- [ ]` checkbox，且 Task 序号一一对应
- [ ] 计划文件中无 `TODO`、`TBD` 等占位符
- [ ] 此阶段**不应**出现任何代码改动

**通过后** → 进入第三步

---

### 第三步：build — 执行实现

**你做什么**

1. 输入 `/sddflow build`
2. 若 AI 提示前置文件缺失，回到第二步补齐 spec
3. 实现过程中可随时说「继续」让 AI 从断点恢复
4. 关注 AI 按 plan 逐 Task 执行，每个 Task 遵循 TDD（先写测试再写实现）

**产出**

- 代码与测试文件
- plan 文件中 checkbox 逐步从 `[ ]` 变为 `[x]`

**你需要检查**

- [ ] build 开始前，AI 已校验：`proposal.md`、`specs/`、`tasks.md`、`plan-ready.md`、superpowers plan 均存在
- [ ] 实现过程中若发现**需求或验收条件变了**，不要直接改代码，应切到 amend（见下方）
- [ ] 全部 Task 与 Step 的 checkbox 均为 `[x]` 时，build 才算完成

**通过后** → 进入第四步

---

### （按需）amend — 需求变更修订

**何时使用**

- build 中发现原需求遗漏、边界或验收条件需调整
- close 前发现规格本身不完整（不是代码没按 spec 实现）

**你做什么**

1. 输入 `/sddflow amend`，说明要改什么
2. 确认 AI 对 `proposal.md`、`specs/`、`tasks.md`、`plan-ready.md`、实现计划的修订
3. 修订完成后输入 `/sddflow build` 继续实现

**你需要检查**

- [ ] 变更已同步到 OpenSpec 文档与三份任务文档
- [ ] `openspec validate <变更名> --strict` 仍能通过（若 specs 有改动）
- [ ] amend 阶段**不应**直接改代码（除非 AI 明确是在 amend 流程中更新计划文档）

**完成后** → 回到第三步继续 build

---

### 第四步：close — 验证与归档

**你做什么**

1. 确认 build 已全部完成（所有 checkbox 为 `[x]`）
2. 输入 `/sddflow close`
3. 按 AI 提示确认是否执行代码审查
4. 阅读验证结果，确认归档

**AI 会执行**

- 运行测试套件与构建（必须看到实际通过输出）
- 对照 `tasks.md`、`plan-ready.md` 与 specs 验证实现完整性
- `openspec validate <变更名> --strict` 规格一致性校验
- 调用 OpenSpec Archive 将变更移入 `openspec/changes/archive/`

**你需要检查**

- [ ] 测试全部通过（0 failures）
- [ ] 每条 task 有对应实现与测试证据
- [ ] 无 CRITICAL 级别的规格不一致问题
- [ ] 归档后 `openspec/changes/<变更名>/` 已移至 `archive/` 目录
- [ ] `openspec/specs/` 已同步更新（若本次变更涉及规格合并）

**完成后** → 本次变更结束；新需求从第一步重新开始

---

### 续接说明

对话中补充范围、回答确认问题或说「继续」时，默认**保持当前阶段**，不会自动跳到 build。只有显式输入 `/sddflow build` 或在状态检测判定为 build 阶段时，才应修改代码。
