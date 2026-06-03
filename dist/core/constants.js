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
        checkPath: 'writing-plans/SKILL.md',
        installHint: '请在当前工具中安装 Superpowers writing-plans skill（Claude Code: /plugin install superpowers@claude-plugins-official）',
        autoInstallable: false,
    },
};
export const TOOL_PATHS = {
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
