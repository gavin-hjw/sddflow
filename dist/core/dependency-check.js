import { execSync } from 'child_process';
import { cmdExists, fileExists, dirExists, exec } from '../utils/shell.js';
import { DEPS, TOOL_PATHS } from './constants.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
export function checkDependencies(options = {}) {
    const home = os.homedir();
    const cwd = options.cwd ?? process.cwd();
    const tools = options.tools?.length ? options.tools : Object.keys(TOOL_PATHS);
    // Check OpenSpec
    const openspecInstalled = cmdExists(DEPS.openspec.cliCmd);
    let openspecVersion;
    if (openspecInstalled) {
        openspecVersion = exec('openspec --version') || undefined;
    }
    // Check Superpowers in the selected tools' local and global skill dirs.
    const superpowersSkillPaths = getSuperpowersSkillPaths(cwd, home, tools);
    const superpowersSkillPath = superpowersSkillPaths.find((candidate) => fs.existsSync(candidate));
    const superpowersInstalled = Boolean(superpowersSkillPath);
    return {
        openspec: {
            installed: openspecInstalled,
            version: openspecVersion,
        },
        superpowers: {
            installed: superpowersInstalled,
            hint: superpowersInstalled ? undefined : DEPS.superpowers.installHint,
            path: superpowersSkillPath,
            checkedPaths: superpowersSkillPaths,
        },
    };
}
function getSuperpowersSkillPaths(cwd, home, tools) {
    const candidates = new Set();
    for (const tool of tools) {
        const toolPaths = TOOL_PATHS[tool];
        if (!toolPaths)
            continue;
        candidates.add(path.join(cwd, toolPaths.skillsDir, DEPS.superpowers.checkPath));
        candidates.add(path.join(home, toolPaths.skillsDir, DEPS.superpowers.checkPath));
    }
    return [...candidates];
}
export function tryAutoInstall(pkg) {
    logger.step(`Installing ${pkg} ...`);
    try {
        execSync(`npm install -g ${pkg}@latest`, { stdio: 'inherit' });
        logger.success(`${pkg} installed`);
        return true;
    }
    catch {
        logger.error(`Failed to install ${pkg} — please run manually: npm install -g ${pkg}@latest`);
        return false;
    }
}
export function checkOpenSpecInitialized(cwd) {
    return dirExists(path.join(cwd, 'openspec'));
}
export function readState(cwd) {
    for (const stateFile of getStateFileCandidates(cwd)) {
        if (!fileExists(stateFile))
            continue;
        try {
            return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        }
        catch {
            // 解析失败继续尝试下一个候选文件
            continue;
        }
    }
    return null;
}
export function writeState(cwd, state) {
    const stateDir = path.join(cwd, '.sddflow');
    if (!dirExists(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
    }
    const stateFile = path.join(stateDir, 'state.json');
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
}
function getStateFileCandidates(cwd) {
    return [
        path.join(cwd, '.sddflow', 'state.json'),
        path.join(cwd, '.claude', 'sddflow-state.json'),
    ];
}
