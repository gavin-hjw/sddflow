export declare const PKG_NAME = "@gavin-hjw/sddflow";
export declare const PKG_BIN = "sddflow";
export declare const SKILL_NAME = "sddflow";
export declare const COMMAND_PREFIX = "/sddflow";
export declare const DEPS: {
    readonly openspec: {
        readonly name: "OpenSpec";
        readonly cliCmd: "openspec";
        readonly npmPkg: "@fission-ai/openspec";
        readonly installHint: "npm install -g @fission-ai/openspec@latest";
        readonly autoInstallable: true;
    };
    readonly superpowers: {
        readonly name: "Superpowers";
        readonly checkPath: "writing-plans/SKILL.md";
        readonly installHint: "请在当前工具中安装 Superpowers writing-plans skill（Claude Code: /plugin install superpowers@claude-plugins-official）";
        readonly autoInstallable: false;
    };
};
export declare const TOOL_PATHS: Record<string, {
    skillsDir: string;
    commandsDir?: string;
}>;
