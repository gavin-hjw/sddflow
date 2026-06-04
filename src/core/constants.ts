export const PKG_NAME = '@gavin-hjw/sddflow';
export const PKG_BIN = 'sddflow';
export const SKILL_NAME = 'sddflow';
export const COMMAND_PREFIX = '/sddflow';

export const DEPS = {
  openspec: {
    name: 'OpenSpec',
    cliCmd: 'openspec',
    npmPkg: '@fission-ai/openspec',
    installHint: 'npm install -g @fission-ai/openspec@latest',
    autoInstallable: true,
  },
  superpowers: {
    name: 'Superpowers',
    installHint: '请在当前工具中安装 Superpowers 插件',
    autoInstallable: false,
  },
} as const;

/** sddflow 工作流依赖的 Superpowers skills */
export const SUPERPOWERS_REQUIRED_SKILLS = [
  'brainstorming',
  'writing-plans',
  'subagent-driven-development',
  'test-driven-development',
  'verification-before-completion',
  'finishing-a-development-branch',
] as const;

export type SuperpowersRequiredSkill = (typeof SUPERPOWERS_REQUIRED_SKILLS)[number];

/**
 * openspec init 为各工具生成的 skill/command 标记文件。
 * 只要其中任意一个存在，就视为 openspec init 已成功执行过。
 * key = tool name，value = 相对项目根的路径列表（任意一个存在即可）
 */
export const OPENSPEC_INIT_MARKERS: Record<string, string[]> = {
  claude: [
    '.claude/skills/openspec-propose/SKILL.md',
    '.claude/commands/opsx/propose.md',
  ],
  cursor: [
    '.cursor/skills/openspec-propose/SKILL.md',
    '.cursor/commands/opsx/propose.md',
  ],
  codex: [
    '.codex/skills/openspec-propose/SKILL.md',
    '.codex/commands/opsx/propose.md',
  ],
  opencode: [
    '.opencode/commands/opsx/propose.md',
  ],
};

/** 各工具安装 Superpowers 的具体指引 */
export const SUPERPOWERS_INSTALL_HINTS: Record<string, string[]> = {
  claude: [
    '在 Claude Code 中执行: /plugin install superpowers@claude-plugins-official',
  ],
  cursor: [
    '在 Cursor 中安装 Superpowers 插件（Settings → Plugins → superpowers）',
  ],
  codex: [
    '在 Codex 中安装 Superpowers 插件',
  ],
  opencode: [
    '在 OpenCode 中安装 Superpowers 插件',
  ],
};

/** 各工具 Superpowers 插件缓存目录 */
export const SUPERPOWERS_PLUGIN_CACHE_DIRS: Record<string, string> = {
  claude: '.claude/plugins/cache/claude-plugins-official/superpowers',
  cursor: '.cursor/plugins/cache/cursor-public/superpowers',
};

export const TOOL_PATHS: Record<string, { skillsDir: string; commandsDir?: string }> = {
  claude: {
    skillsDir: '.claude/skills',
    commandsDir: '.claude/commands',
  },
  codex: {
    skillsDir: '.codex/skills',
  },
  cursor: {
    skillsDir: '.cursor/skills',
  },
  opencode: {
    skillsDir: '.opencode/commands',
  },
};
