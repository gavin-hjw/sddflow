import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileExists } from '../utils/shell.js';
import { logger } from '../utils/logger.js';
import { SKILL_NAME, TOOL_PATHS, DEPS } from './constants.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve templates dir: from dist/core/ → ../../templates/
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');
const PHASES = [
    { name: 'brainstorming', description: 'Deep design exploration' },
    { name: 'spec', description: 'Complete OpenSpec artifacts per AGENTS.md, then plan-ready and writing-plans' },
    { name: 'amend', description: 'Revise requirements/specs before close' },
    { name: 'build', description: 'Execute implementation' },
    { name: 'close', description: 'Verify consistency and archive' },
];
const PHASE_ALIAS_TOOLS = new Set(['claude', 'codex', 'cursor']);
export function generateSkills(options) {
    const { cwd, tools, depStatus, global = false } = options;
    const baseDir = global ? os.homedir() : cwd;
    for (const tool of tools) {
        const toolPaths = TOOL_PATHS[tool];
        if (!toolPaths) {
            logger.warn(`Unknown tool: ${tool}, skipping`);
            continue;
        }
        const skillsDir = path.join(baseDir, toolPaths.skillsDir, SKILL_NAME);
        const displayPath = global
            ? path.join('~', toolPaths.skillsDir, SKILL_NAME)
            : path.relative(cwd, skillsDir);
        logger.step(`Generating ${tool} skills to ${displayPath}/`);
        if (!fs.existsSync(skillsDir)) {
            fs.mkdirSync(skillsDir, { recursive: true });
        }
        // Generate main SKILL.md
        generateSkillFile(skillsDir, 'SKILL.md', depStatus);
        // Generate phase files
        for (const phase of PHASES) {
            generateSkillFile(skillsDir, `${phase.name}.md`, depStatus);
        }
        if (PHASE_ALIAS_TOOLS.has(tool)) {
            generatePhaseAliasSkills({
                baseDir,
                skillsDir: toolPaths.skillsDir,
                cwd,
                global,
            });
        }
        logger.success(`${tool} skills generated`);
    }
}
function generateSkillFile(skillsDir, filename, depStatus) {
    const templatePath = path.join(TEMPLATES_DIR, filename);
    let content;
    if (fileExists(templatePath)) {
        content = fs.readFileSync(templatePath, 'utf-8');
    }
    else {
        // Fallback: use inline template
        content = getInlineTemplate(filename, depStatus);
    }
    // Inject runtime dependency checks into build.md
    if (filename === 'build.md') {
        content = injectRuntimeDepCheck(content, depStatus);
    }
    const targetPath = path.join(skillsDir, filename);
    fs.writeFileSync(targetPath, content);
    logger.step(`  ${filename}`);
}
function generatePhaseAliasSkills(options) {
    const { baseDir, skillsDir, cwd, global } = options;
    for (const phase of PHASES) {
        const aliasName = `${SKILL_NAME}-${phase.name}`;
        const aliasDir = path.join(baseDir, skillsDir, aliasName);
        const displayPath = global
            ? path.join('~', skillsDir, aliasName, 'SKILL.md')
            : path.relative(cwd, path.join(aliasDir, 'SKILL.md'));
        if (!fs.existsSync(aliasDir)) {
            fs.mkdirSync(aliasDir, { recursive: true });
        }
        fs.writeFileSync(path.join(aliasDir, 'SKILL.md'), getPhaseAliasTemplate(phase.name, phase.description));
        logger.step(`  ${displayPath}`);
    }
}
function getPhaseAliasTemplate(phase, description) {
    return `---
name: ${SKILL_NAME}-${phase}
description: "SDDFlow ${phase}: ${description}. Visibility alias for ${SKILL_NAME} ${phase}."
argument-hint: "[optional context]"
---

# ${SKILL_NAME}-${phase}

这是 \`${SKILL_NAME} ${phase}\` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 \`/${SKILL_NAME} ${phase} $ARGUMENTS\`
2. 读取同级 skills 目录中的 \`${SKILL_NAME}/SKILL.md\`
3. 读取 \`${SKILL_NAME}/${phase}.md\`
4. 严格遵守主 sddflow 工作流、阶段写入边界和当前阶段文件
5. 如果 \`$ARGUMENTS\` 中有额外需求或上下文，将它作为 ${phase} 阶段输入
`;
}
function injectRuntimeDepCheck(content, _depStatus) {
    const checkSection = `
### 0. 依赖检测

执行前检查以下依赖是否可用（**不在 build 阶段生成或重写计划文件**）：

| 依赖 | 检测方式 | 不可用时 |
|------|----------|----------|
| 详细实现计划 | \`docs/superpowers/plans/\` 下存在含变更名的 \`.md\` 文件 | **终止 build**，提示先完成 \`/sddflow spec\` |
| Superpowers subagent-driven-development | skills 目录下是否存在 \`subagent-driven-development/SKILL.md\` | 降级为按 plan 文件逐步手动执行 |
| Superpowers test-driven-development | skills 目录下是否存在 \`test-driven-development/SKILL.md\` | 提示安装；仍按 plan 执行，须自述遵守 TDD |
| OpenSpec CLI | \`openspec\` 命令是否可执行 | 不影响 build；close 归档可改用 \`OpenSpec: Archive\` 或 \`openspec archive\` |

如果 Superpowers 子技能缺失，提示用户：
> "Superpowers 未完整安装，build 将使用手动执行模式。安装后体验更佳：${DEPS.superpowers.installHint}"

**禁止**在 build 阶段调用 \`writing-plans\`；计划必须在 spec 阶段已生成。
`;
    // Insert after the first heading
    const lines = content.split('\n');
    const firstH2Idx = lines.findIndex((l) => l.startsWith('## '));
    if (firstH2Idx >= 0) {
        lines.splice(firstH2Idx + 1, 0, checkSection);
    }
    else {
        lines.unshift(checkSection);
    }
    return lines.join('\n');
}
function getInlineTemplate(filename, _depStatus) {
    const templatePath = path.join(TEMPLATES_DIR, filename);
    if (fileExists(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
    }
    return `# ${filename}\n\nTODO: implement\n`;
}
