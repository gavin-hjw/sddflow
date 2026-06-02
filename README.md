# @gavin-hjw/sddflow

[中文文档](./README.zh-CN.md)

OpenSpec + Superpowers workflow orchestrator — bridging requirements specs and engineering execution, eliminating the format gap.

## Installation

```bash
npm install -g @gavin-hjw/sddflow
```

## Usage

### Initialize a project

```bash
cd your-project
sddflow init --tools claude
```

`init` will automatically:
1. Detect and guide OpenSpec CLI installation
2. Detect Superpowers and show install instructions
3. Check if OpenSpec is initialized in the project
4. Generate sddflow skills to the selected tools' local skill directories, such as `.claude/skills/sddflow/`, `.codex/skills/sddflow/`, `.cursor/skills/sddflow/`, or `.opencode/commands/sddflow/`

Supported tools: `claude`, `codex`, `cursor`, `opencode` (comma-separated, e.g. `--tools claude,codex`)

### Install skills globally

```bash
sddflow init --tools claude -g
sddflow init --tools claude,codex,cursor,opencode --global
```

With `-g` / `--global`, `sddflow` installs skills under the selected tools' home directories:

| Tool | Global skill path |
|------|-------------------|
| `claude` | `~/.claude/skills/sddflow/` |
| `codex` | `~/.codex/skills/sddflow/` |
| `cursor` | `~/.cursor/skills/sddflow/` |
| `opencode` | `~/.opencode/commands/sddflow/` |

### Check status

```bash
sddflow status
```

Shows dependency installation status and active changes in the project.

### Update skills

```bash
sddflow update
```

Re-generates project skills after upgrading the npm package.

## Workflow Commands

Canonical usage is `/sddflow <phase>`. For Claude Code, Codex, and Cursor,
`sddflow` also generates visible phase aliases such as `/sddflow-spec` or
`$sddflow-spec` so typing `sddflow` in the command/skill picker surfaces the
available phases. OpenCode keeps its native command-tree form under
`/sddflow/spec`, `/sddflow/build`, and so on.

| Command | Phase | Description |
|---------|-------|-------------|
| `/sddflow proposal` | proposal | Lightweight capture — 3-5 questions to converge on requirements |
| `/sddflow brainstorming` | brainstorming | Deep design — multi-round tradeoff exploration |
| `/sddflow spec` | spec | Call OpenSpec to generate specs + auto-translate to plan-ready.md |
| `/sddflow amend` | amend | Revise requirements/specs before close and update plan-ready.md |
| `/sddflow build` | build | Call Superpowers to execute implementation |
| `/sddflow close` | close | Verify consistency + archive |

## Dependency Strategy

```
Best with: OpenSpec + Superpowers
Works without them: yes, with manual-file fallback
```

| Dependency | Install | Fallback when missing |
|------------|---------|----------------------|
| OpenSpec | `npm install -g @fission-ai/openspec@latest` | Manually create `openspec/changes/` directories and files |
| Superpowers | `/plugin install superpowers@claude-plugins-official` | Manually break down plan-ready.md steps in build phase |

### Dual-layer dependency check

| Layer | Mechanism | When missing |
|-------|-----------|-------------|
| **Init time** | Detect OpenSpec CLI from `PATH`; detect project OpenSpec in `./openspec/`; detect Superpowers in the selected tools' local/global skill dirs | Non-blocking, skills still generated |
| **Runtime** | Dependency check injected into SKILL.md | Build phase falls back to manual step-by-step execution |

## Architecture

```
User Requirements
   │
   ├── Quick ──→ /sddflow proposal ──┐
   │           3-5 questions          │
   │                                  ├─→ proposal.md
   └── Deep ───→ /sddflow brainstorming ─┘ (openspec/changes/<name>/)
               Multi-round exploration
                                     │
                          ┌──────────▼───────────┐
                          │  /sddflow spec         │
                          │  OpenSpec generates     │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   Translation Layer    │
                          │  Requirements → Eng    │
                          └──────────┬───────────┘
                                     │
                                plan-ready.md
                                     │
                          ┌──────────▼───────────┐
                          │  /sddflow build       │
                          │  Superpowers execution │
                          │  TDD + checkpoint      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /sddflow amend       │
                          │  Requirement revision  │
                          │  (only when needed)    │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  /sddflow close       │
                          │  Verify + archive      │
                          └──────────────────────┘
```

## Acknowledgments

sddflow orchestrates two open-source projects:

| Project | Repository | License | Usage |
|---------|-----------|---------|-------|
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | `@fission-ai/openspec` | MIT | Generates structured spec files (proposal.md, design.md, specs/, tasks.md). sddflow calls its CLI and reads its output format. |
| [Superpowers](https://github.com/obra/superpowers) | `superpowers` plugin | MIT | Provides `writing-plans` skill for detailed implementation planning. sddflow delegates build-phase execution to its workflow. |

sddflow is a **standalone orchestrator** — it does not bundle, fork, or embed code from either project. Dependencies are detected at init/runtime, with manual fallback when either is not installed.

## License

MIT
