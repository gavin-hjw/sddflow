import { Command } from 'commander';
import inquirer from 'inquirer';
import { checkDependencies, tryAutoInstall, writeState, validateComponentInstallation, validateSuperpowersSkills, printInitPrerequisiteFailures, verifyOpenSpecInitIntegrity, runOpenSpecInit, printIntegrityFailures, } from '../core/dependency-check.js';
import { generateSkills } from '../core/skill-generator.js';
import { DEPS, SUPERPOWERS_REQUIRED_SKILLS, OPENSPEC_INIT_MARKERS } from '../core/constants.js';
import path from 'path';
import { logger } from '../utils/logger.js';
export const initCommand = new Command('init')
    .description('Initialize sddflow skills in the current project')
    .option('-t, --tools <tools>', 'Target tools, comma-separated', 'claude')
    .option('-g, --global', 'Install skills globally under home tool directories')
    .action(async (options) => {
    const cwd = process.cwd();
    const tools = options.tools.split(',').map((t) => t.trim());
    const installGlobally = Boolean(options.global);
    logger.blank();
    logger.info(`sddflow init — ${installGlobally ? 'global skill setup' : 'workflow orchestrator setup'}`);
    logger.blank();
    // ── 阶段 1：检测 OpenSpec CLI + Superpowers 插件 ──
    logger.step('[1/4] Checking OpenSpec CLI ...');
    let depStatus = checkDependencies({ cwd, tools });
    if (!depStatus.openspec.installed) {
        logger.warn('OpenSpec CLI not installed');
        const { installOpenSpec } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'installOpenSpec',
                message: `Auto-install? (${DEPS.openspec.installHint})`,
                default: true,
            },
        ]);
        if (installOpenSpec) {
            const ok = tryAutoInstall(DEPS.openspec.npmPkg);
            depStatus = checkDependencies({ cwd, tools });
            if (ok)
                depStatus.openspec.autoInstalled = true;
        }
    }
    else {
        logger.success(`OpenSpec CLI installed${depStatus.openspec.version ? ` (v${depStatus.openspec.version})` : ''}`);
    }
    logger.step('[1/4] Checking Superpowers plugin ...');
    if (depStatus.superpowers.pluginInstalled) {
        logger.success('Superpowers plugin installed');
    }
    else {
        logger.warn('Superpowers plugin not found');
    }
    const componentFailures = validateComponentInstallation(depStatus, tools);
    if (componentFailures.length > 0) {
        printInitPrerequisiteFailures(componentFailures);
        process.exit(1);
    }
    // ── 阶段 2：检测 Superpowers 必需 skills ──
    logger.step('[2/4] Checking Superpowers required skills ...');
    for (const skill of depStatus.superpowers.skills) {
        if (skill.installed) {
            logger.success(`  /${skill.name}${skill.path ? ` (${skill.path})` : ''}`);
        }
        else {
            logger.warn(`  /${skill.name} — missing`);
        }
    }
    const skillFailures = validateSuperpowersSkills(depStatus, tools);
    if (skillFailures.length > 0) {
        printInitPrerequisiteFailures(skillFailures);
        process.exit(1);
    }
    // ── 阶段 3：自动执行 openspec init ──
    if (installGlobally) {
        logger.step('[3/4] Skipping project OpenSpec init for global install');
    }
    else {
        logger.step('[3/4] Running openspec init ...');
        let integrity = verifyOpenSpecInitIntegrity(cwd, tools);
        if (integrity.ok) {
            logger.success('OpenSpec already initialized in this project');
        }
        else {
            logger.info(`Running: openspec init --tools ${tools.join(',')}`);
            const ok = runOpenSpecInit(cwd, tools);
            if (!ok) {
                printInitPrerequisiteFailures([
                    {
                        id: 'openspec-init',
                        name: 'OpenSpec Init',
                        reason: 'openspec init 执行失败',
                        installSteps: [
                            `请手动执行: openspec init --tools ${tools.join(',')}`,
                            `完成后重新运行: sddflow init --tools ${tools.join(',')}`,
                        ],
                    },
                ]);
                process.exit(1);
            }
            logger.success('openspec init completed');
        }
        // ── 阶段 4：校验 OpenSpec 初始化完整性 ──
        logger.step('[4/4] Verifying OpenSpec init integrity ...');
        integrity = verifyOpenSpecInitIntegrity(cwd, tools);
        if (!integrity.ok) {
            printIntegrityFailures(integrity, tools);
            process.exit(1);
        }
        logger.success('OpenSpec init integrity check passed');
        for (const tool of tools) {
            const markers = OPENSPEC_INIT_MARKERS[tool] ?? [];
            for (const marker of markers) {
                const { fileExists: fe } = await import('../utils/shell.js');
                const fp = path.join(cwd, marker);
                if (fe(fp)) {
                    logger.info(`  ✓ ${marker}`);
                    break;
                }
            }
        }
    }
    // ── 生成 sddflow skills ──
    logger.step('Generating sddflow skills ...');
    depStatus = checkDependencies({ cwd, tools });
    generateSkills({ cwd, tools, depStatus, global: installGlobally });
    if (!installGlobally) {
        writeState(cwd, {
            openspec: depStatus.openspec.installed,
            superpowers: depStatus.superpowers.allSkillsInstalled,
            openspecProjectInitialized: verifyOpenSpecInitIntegrity(cwd, tools).ok,
            createdAt: new Date().toISOString(),
            tools,
        });
    }
    logger.blank();
    logger.success('sddflow initialized!');
    logger.blank();
    logger.info(`Verified Superpowers skills (${SUPERPOWERS_REQUIRED_SKILLS.length}):`);
    for (const skill of SUPERPOWERS_REQUIRED_SKILLS) {
        logger.info(`  /${skill}`);
    }
    logger.blank();
    logger.info('Available commands:');
    logger.info('  /sddflow brainstorming  Deep design exploration');
    logger.info('  /sddflow spec           Generate specs + translate');
    logger.info('  /sddflow amend          Revise requirements before close');
    logger.info('  /sddflow build          Execute implementation');
    logger.info('  /sddflow close          Verify + archive');
    logger.blank();
});
