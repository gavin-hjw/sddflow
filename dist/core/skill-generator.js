import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileExists } from '../utils/shell.js';
import { logger } from '../utils/logger.js';
import { SKILL_NAME, TOOL_PATHS } from './constants.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve templates dir: from dist/core/ → ../../templates/
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');
const PHASES = [
    {
        name: 'brainstorming',
        description: 'Deep design exploration',
        triggers: '需求探索、方案设计、brainstorming',
    },
    {
        name: 'spec',
        description: 'Complete OpenSpec artifacts per AGENTS.md, then plan-ready and writing-plans',
        triggers: '规格生成、OpenSpec、writing-plans',
    },
    {
        name: 'amend',
        description: 'Revise requirements/specs before close',
        triggers: '需求修订、规格变更、amend',
    },
    {
        name: 'build',
        description: 'Execute implementation',
        triggers: '执行实现、TDD 开发、build',
    },
    {
        name: 'close',
        description: 'Verify consistency and archive',
        triggers: '验证归档、收尾合并、close',
    },
];
const PHASES_REQUIRING_DISABLE_MODEL_INVOCATION = new Set(['build', 'close']);
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
        // Generate phase reference files
        const referencesDir = path.join(skillsDir, 'references');
        if (!fs.existsSync(referencesDir)) {
            fs.mkdirSync(referencesDir, { recursive: true });
        }
        for (const phase of PHASES) {
            generateSkillFile(referencesDir, `${phase.name}.md`, depStatus, 'references');
        }
        removeLegacyPhaseFiles(skillsDir);
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
function generateSkillFile(targetDir, filename, depStatus, templateSubdir) {
    const templatePath = templateSubdir
        ? path.join(TEMPLATES_DIR, templateSubdir, filename)
        : path.join(TEMPLATES_DIR, filename);
    let content;
    if (fileExists(templatePath)) {
        content = fs.readFileSync(templatePath, 'utf-8');
    }
    else {
        // Fallback: use inline template
        content = getInlineTemplate(filename, depStatus, templateSubdir);
    }
    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, content);
    const displayName = templateSubdir ? `${templateSubdir}/${filename}` : filename;
    logger.step(`  ${displayName}`);
}
function removeLegacyPhaseFiles(skillsDir) {
    for (const phase of PHASES) {
        const legacyPath = path.join(skillsDir, `${phase.name}.md`);
        if (fs.existsSync(legacyPath)) {
            fs.unlinkSync(legacyPath);
        }
    }
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
        fs.writeFileSync(path.join(aliasDir, 'SKILL.md'), getPhaseAliasTemplate(phase.name, phase.description, phase.triggers));
        logger.step(`  ${displayPath}`);
    }
}
function getPhaseAliasTemplate(phase, description, triggers) {
    const disableModelInvocation = PHASES_REQUIRING_DISABLE_MODEL_INVOCATION.has(phase)
        ? 'disable-model-invocation: true\n'
        : '';
    return `---
name: ${SKILL_NAME}-${phase}
description: "SDDFlow ${phase}: ${description}. Visibility alias for ${SKILL_NAME} ${phase}. 触发词：${triggers}."
${disableModelInvocation}---

# ${SKILL_NAME}-${phase}

这是 \`${SKILL_NAME} ${phase}\` 的补全可见别名。

执行时必须按以下方式处理：

1. 将本次调用视为用户调用了 \`/${SKILL_NAME} ${phase} $ARGUMENTS\`
2. 读取同级 skills 目录中的 \`${SKILL_NAME}/SKILL.md\`
3. 读取 \`${SKILL_NAME}/references/${phase}.md\`
4. 严格遵守主 sddflow 工作流、阶段写入边界和当前阶段文件
5. 如果 \`$ARGUMENTS\` 中有额外需求或上下文，将它作为 ${phase} 阶段输入
`;
}
function getInlineTemplate(filename, _depStatus, templateSubdir) {
    const templatePath = templateSubdir
        ? path.join(TEMPLATES_DIR, templateSubdir, filename)
        : path.join(TEMPLATES_DIR, filename);
    if (fileExists(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
    }
    return `# ${filename}\n\nTODO: implement\n`;
}
