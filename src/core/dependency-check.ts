import { execSync } from 'child_process';
import { cmdExists, fileExists, dirExists, exec, execOrThrow } from '../utils/shell.js';
import {
  DEPS,
  TOOL_PATHS,
  SUPERPOWERS_INSTALL_HINTS,
  SUPERPOWERS_PLUGIN_CACHE_DIRS,
  SUPERPOWERS_REQUIRED_SKILLS,
  OPENSPEC_INIT_MARKERS,
  type SuperpowersRequiredSkill,
} from './constants.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface SuperpowersSkillStatus {
  name: SuperpowersRequiredSkill;
  installed: boolean;
  path?: string;
}

export interface DepStatus {
  openspec: {
    installed: boolean;
    version?: string;
    autoInstalled?: boolean;
  };
  superpowers: {
    pluginInstalled: boolean;
    skills: SuperpowersSkillStatus[];
    allSkillsInstalled: boolean;
    /** 兼容旧字段：等同 allSkillsInstalled */
    installed: boolean;
  };
}

export interface InitPrerequisiteFailure {
  id: 'openspec-cli' | 'superpowers-plugin' | 'superpowers-skills' | 'openspec-init';
  name: string;
  reason: string;
  installSteps: string[];
}

export interface IntegrityCheckResult {
  ok: boolean;
  missing: string[];
}

export interface CheckDependencyOptions {
  cwd?: string;
  tools?: string[];
}

export function checkDependencies(options: CheckDependencyOptions = {}): DepStatus {
  const home = os.homedir();
  const cwd = options.cwd ?? process.cwd();
  const tools = options.tools?.length ? options.tools : Object.keys(TOOL_PATHS);

  const openspecInstalled = cmdExists(DEPS.openspec.cliCmd);
  let openspecVersion: string | undefined;
  if (openspecInstalled) {
    openspecVersion = exec('openspec --version') || undefined;
  }

  const pluginInstalled = isSuperpowersPluginInstalled(home, tools);
  const skills = checkSuperpowersSkills(cwd, home, tools);
  const allSkillsInstalled = skills.every((skill) => skill.installed);

  return {
    openspec: {
      installed: openspecInstalled,
      version: openspecVersion,
    },
    superpowers: {
      pluginInstalled,
      skills,
      allSkillsInstalled,
      installed: allSkillsInstalled,
    },
  };
}

function isSuperpowersPluginInstalled(home: string, tools: string[]): boolean {
  for (const tool of tools) {
    const cacheDir = SUPERPOWERS_PLUGIN_CACHE_DIRS[tool];
    if (!cacheDir) continue;

    const cacheRoot = path.join(home, cacheDir);
    if (!dirExists(cacheRoot)) continue;

    const versions = fs.readdirSync(cacheRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    if (versions.length > 0) return true;
  }

  return false;
}

export function checkSuperpowersSkills(
  cwd: string,
  home: string,
  tools: string[],
): SuperpowersSkillStatus[] {
  return SUPERPOWERS_REQUIRED_SKILLS.map((skillName) => {
    const skillPath = findSuperpowersSkillPath(cwd, home, tools, skillName);
    return {
      name: skillName,
      installed: Boolean(skillPath),
      path: skillPath,
    };
  });
}

function findSuperpowersSkillPath(
  cwd: string,
  home: string,
  tools: string[],
  skillName: string,
): string | undefined {
  for (const tool of tools) {
    const toolPaths = TOOL_PATHS[tool];
    if (!toolPaths) continue;

    const localPath = path.join(cwd, toolPaths.skillsDir, skillName, 'SKILL.md');
    if (fileExists(localPath)) return localPath;

    const globalPath = path.join(home, toolPaths.skillsDir, skillName, 'SKILL.md');
    if (fileExists(globalPath)) return globalPath;

    const pluginCacheDir = SUPERPOWERS_PLUGIN_CACHE_DIRS[tool];
    if (pluginCacheDir) {
      const cached = findSkillInPluginCache(path.join(home, pluginCacheDir), skillName);
      if (cached) return cached;
    }
  }

  return undefined;
}

function findSkillInPluginCache(pluginCacheRoot: string, skillName: string): string | undefined {
  if (!dirExists(pluginCacheRoot)) return undefined;

  for (const entry of fs.readdirSync(pluginCacheRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(pluginCacheRoot, entry.name, 'skills', skillName, 'SKILL.md');
    if (fileExists(skillPath)) return skillPath;
  }

  return undefined;
}

/** 阶段 1：检测 OpenSpec CLI + Superpowers 插件是否已安装 */
export function validateComponentInstallation(
  depStatus: DepStatus,
  tools: string[],
): InitPrerequisiteFailure[] {
  const failures: InitPrerequisiteFailure[] = [];
  const toolsLabel = tools.join(',');

  if (!depStatus.openspec.installed) {
    failures.push({
      id: 'openspec-cli',
      name: DEPS.openspec.name,
      reason: '未检测到 OpenSpec CLI（openspec 命令不可用）',
      installSteps: [
        DEPS.openspec.installHint,
        `安装完成后重新运行: sddflow init --tools ${toolsLabel}`,
      ],
    });
  }

  if (!depStatus.superpowers.pluginInstalled) {
    const installSteps = new Set<string>([DEPS.superpowers.installHint]);
    for (const tool of tools) {
      for (const hint of SUPERPOWERS_INSTALL_HINTS[tool] ?? []) {
        installSteps.add(hint);
      }
    }
    installSteps.add(`安装完成后重新运行: sddflow init --tools ${toolsLabel}`);

    failures.push({
      id: 'superpowers-plugin',
      name: DEPS.superpowers.name,
      reason: '未检测到 Superpowers 插件',
      installSteps: [...installSteps],
    });
  }

  return failures;
}

/** 阶段 2：检测 Superpowers 必需 skills 是否齐全 */
export function validateSuperpowersSkills(
  depStatus: DepStatus,
  tools: string[],
): InitPrerequisiteFailure[] {
  const missing = depStatus.superpowers.skills.filter((skill) => !skill.installed);
  if (missing.length === 0) return [];

  const toolsLabel = tools.join(',');
  const installSteps = new Set<string>([DEPS.superpowers.installHint]);
  for (const tool of tools) {
    for (const hint of SUPERPOWERS_INSTALL_HINTS[tool] ?? []) {
      installSteps.add(hint);
    }
  }
  installSteps.add(`安装完成后重新运行: sddflow init --tools ${toolsLabel}`);

  return [
    {
      id: 'superpowers-skills',
      name: `${DEPS.superpowers.name} Skills`,
      reason: `缺少 ${missing.length} 个必需 skill: ${missing.map((s) => s.name).join(', ')}`,
      installSteps: [...installSteps],
    },
  ];
}

export function verifyOpenSpecInitIntegrity(cwd: string, tools: string[]): IntegrityCheckResult {
  const missing: string[] = [];

  for (const tool of tools) {
    const markers = OPENSPEC_INIT_MARKERS[tool];
    if (!markers) continue;

    const found = markers.some((marker) => fileExists(path.join(cwd, marker)));
    if (!found) {
      missing.push(`${tool}: openspec init marker not found (expected one of: ${markers.join(', ')})`);
    }
  }

  return { ok: missing.length === 0, missing };
}

export function runOpenSpecInit(cwd: string, tools: string[]): boolean {
  const toolsFlag = tools.join(',');
  try {
    execOrThrow(`openspec init --tools ${toolsFlag}`, { cwd, stdio: 'inherit' });
    return true;
  } catch {
    logger.error(`openspec init --tools ${toolsFlag} 执行失败`);
    return false;
  }
}

export function printInitPrerequisiteFailures(
  failures: InitPrerequisiteFailure[],
  title = '初始化已中止：缺少必要依赖，请先安装后再运行 sddflow init',
): void {
  logger.blank();
  logger.error(title);
  logger.blank();

  for (const failure of failures) {
    logger.warn(`${failure.name}: ${failure.reason}`);
    logger.info('  安装步骤:');
    for (const step of failure.installSteps) {
      logger.info(`    ${step}`);
    }
    logger.blank();
  }
}

export function printIntegrityFailures(result: IntegrityCheckResult, tools: string[]): void {
  printInitPrerequisiteFailures(
    [
      {
        id: 'openspec-init',
        name: 'OpenSpec 初始化完整性',
        reason: `openspec init 后仍缺少 ${result.missing.length} 个文件`,
        installSteps: [
          '请检查 openspec init 输出是否有报错',
          `手动重试: openspec init --tools ${tools.join(',')}`,
          `缺失文件:`,
          ...result.missing.map((file) => `  - ${file}`),
          `修复后重新运行: sddflow init --tools ${tools.join(',')}`,
        ],
      },
    ],
    '初始化已中止：OpenSpec 文件完整性校验未通过',
  );
}

export function tryAutoInstall(pkg: string): boolean {
  logger.step(`Installing ${pkg} ...`);
  try {
    execSync(`npm install -g ${pkg}@latest`, { stdio: 'inherit' });
    logger.success(`${pkg} installed`);
    return true;
  } catch {
    logger.error(`Failed to install ${pkg} — please run manually: npm install -g ${pkg}@latest`);
    return false;
  }
}

export function checkOpenSpecInitialized(cwd: string): boolean {
  return dirExists(path.join(cwd, 'openspec'));
}

export interface InitState {
  openspec: boolean;
  superpowers: boolean;
  openspecProjectInitialized: boolean;
  createdAt: string;
  tools: string[];
}

export function readState(cwd: string): InitState | null {
  for (const stateFile of getStateFileCandidates(cwd)) {
    if (!fileExists(stateFile)) continue;
    try {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    } catch {
      continue;
    }
  }

  return null;
}

export function writeState(cwd: string, state: InitState): void {
  const stateDir = path.join(cwd, '.sddflow');
  if (!dirExists(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  const stateFile = path.join(stateDir, 'state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
}

function getStateFileCandidates(cwd: string): string[] {
  return [
    path.join(cwd, '.sddflow', 'state.json'),
    path.join(cwd, '.claude', 'sddflow-state.json'),
  ];
}
