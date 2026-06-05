# @gavin-hjw/sddflow

[中文文档](./README.zh-CN.md)

## About

sddflow is an OpenSpec + Superpowers workflow orchestrator. It connects **design exploration → spec documents → implementation → verification and archive** into one resumable flow, bridging the format gap between requirements specs and engineering execution.

**Before use, you must complete two steps:**

1. **Install dependencies** — OpenSpec CLI, Superpowers plugin, and its 6 required skills (see **Dependencies** below)
2. **Initialize the project** — run `sddflow init` in the target project directory to check dependencies, run `openspec init`, and generate sddflow skills in your AI tool

Until init succeeds, `/sddflow` commands are not available in the AI tool. Each project needs init once; after upgrading the npm package, run `sddflow update` to regenerate skills.

## Installation

```bash
npm install -g @gavin-hjw/sddflow
```

Initialize in your project directory:

```bash
cd your-project
sddflow init --tools claude
```

Supported tools: `claude`, `codex`, `cursor`, `opencode` (comma-separated, e.g. `--tools claude,cursor`).

Install skills globally (shared across projects):

```bash
sddflow init --tools claude --global
```

After upgrading the npm package, regenerate project skills:

```bash
sddflow update
```

Run `sddflow status` to check dependency readiness, OpenSpec init integrity, and the current stage of each active change.

## Dependencies

`sddflow init` checks each item and aborts with install guidance if anything is missing.

| Dependency | Role | Install |
|------------|------|---------|
| **OpenSpec CLI** | Generate and manage structured specs | `npm install -g @fission-ai/openspec@latest` |
| **OpenSpec skill integration** | Invoke OpenSpec from AI tools | Run automatically via `openspec init --tools <tools>` during `sddflow init` |
| **Superpowers plugin** | Implementation planning and build execution | Claude Code: `/plugin install superpowers@claude-plugins-official`; Cursor: Settings → Plugins → superpowers |

Superpowers must also provide these 6 skills: `brainstorming`, `writing-plans`, `subagent-driven-development`, `test-driven-development`, `verification-before-completion`, `finishing-a-development-branch`.

## Workflow

Run these steps in order inside your AI tool. Canonical usage is `/sddflow <phase>`; you can also type `/sddflow` to auto-route based on the current change state.

Claude / Codex / Cursor expose phase aliases (e.g. `/sddflow-brainstorming`); OpenCode uses forms like `/sddflow/brainstorming`.

```
brainstorming → spec → build → close
                  ↑      │
                  └── amend (on requirement change, as needed)
```

---

### Step 1: brainstorming — explore requirements and design

**What you do**

1. Type `/sddflow brainstorming` and describe the change you want
2. Answer AI follow-up questions (one at a time): user scenarios, constraints, tradeoffs, boundaries, acceptance criteria
3. Review 2–3 proposed approaches and pick a direction
4. Confirm the design section by section, then explicitly reply "confirmed" / "OK"

**Output**

- `openspec/changes/<name>/proposal.md`

**What you verify**

- [ ] `openspec/changes/<name>/` directory exists
- [ ] `proposal.md` matches what you confirmed: background, scenarios, approach, scope boundaries, acceptance criteria
- [ ] **No code changes** in this phase

**Then** → proceed to Step 2

---

### Step 2: spec — generate specs and implementation plan

**What you do**

1. Type `/sddflow spec`
2. If multiple active changes exist, tell the AI which one to spec
3. Review the spec summary (proposal, design, specs, tasks) and confirm or request edits
4. Wait for OpenSpec artifacts, the translation layer, and the detailed implementation plan

**Output**

- `openspec/changes/<name>/specs/` (spec deltas)
- `openspec/changes/<name>/tasks.md`
- `openspec/changes/<name>/design.md` (optional)
- `openspec/changes/<name>/plan-ready.md` (engineering translation)
- `docs/superpowers/plans/YYYY-MM-DD-<name>.md` (detailed plan)

**What you verify**

- [ ] `openspec validate <name> --strict` passes (AI should run this; you can re-run it)
- [ ] `specs/` is non-empty and `tasks.md` exists
- [ ] Both `plan-ready.md` and the superpowers plan file exist
- [ ] All three task documents (`tasks.md`, `plan-ready.md`, superpowers plan) use `- [ ]` checkboxes with matching Task numbers
- [ ] No `TODO`, `TBD`, or similar placeholders in plan files
- [ ] **No code changes** in this phase

**Then** → proceed to Step 3

---

### Step 3: build — execute implementation

**What you do**

1. Type `/sddflow build`
2. If the AI reports missing pre-flight files, go back to Step 2
3. Say "continue" anytime to resume from the last checkpoint
4. Monitor Task-by-Task execution with TDD (tests before implementation)

**Output**

- Code and test files
- Plan checkboxes gradually change from `[ ]` to `[x]`

**What you verify**

- [ ] Before build starts, AI confirms: `proposal.md`, `specs/`, `tasks.md`, `plan-ready.md`, and superpowers plan all exist
- [ ] If **requirements or acceptance criteria change**, do not edit code directly — switch to amend (below)
- [ ] Build is complete when all Task and Step checkboxes are `[x]`

**Then** → proceed to Step 4

---

### (As needed) amend — revise requirements

**When to use**

- Requirements, boundaries, or acceptance criteria change during build
- Specs are incomplete before close (not "code doesn't match existing spec")

**What you do**

1. Type `/sddflow amend` and describe what to change
2. Confirm updates to `proposal.md`, `specs/`, `tasks.md`, `plan-ready.md`, and the implementation plan
3. Type `/sddflow build` to continue implementation

**What you verify**

- [ ] OpenSpec documents and all three task documents are in sync
- [ ] `openspec validate <name> --strict` still passes (if specs changed)
- [ ] amend should **not** modify code directly (unless updating plan documents as part of the amend flow)

**Then** → return to Step 3

---

### Step 4: close — verify and archive

**What you do**

1. Confirm build is fully complete (all checkboxes `[x]`)
2. Type `/sddflow close`
3. Follow prompts on whether to run a final code review
4. Review verification results and confirm archive

**What the AI runs**

- Full test suite and build (must show actual passing output)
- Cross-check `tasks.md`, `plan-ready.md`, and specs against implementation
- `openspec validate <name> --strict` for spec consistency
- OpenSpec Archive to move the change into `openspec/changes/archive/`

**What you verify**

- [ ] All tests pass (0 failures)
- [ ] Every task has implementation and test evidence
- [ ] No CRITICAL spec inconsistencies
- [ ] After archive, `openspec/changes/<name>/` is under `archive/`
- [ ] `openspec/specs/` is updated if the change merged spec deltas

**Done** → change complete; start a new change from Step 1

---

### Resuming

Follow-up messages that refine scope, answer confirmation questions, or say "continue" stay in the **current phase** — they do not auto-enter build. Code changes only happen after you explicitly run `/sddflow build` or auto-routing determines the build phase.
