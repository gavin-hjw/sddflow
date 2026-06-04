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
        readonly installHint: "请在当前工具中安装 Superpowers 插件";
        readonly autoInstallable: false;
    };
};
/** sddflow 工作流依赖的 Superpowers skills */
export declare const SUPERPOWERS_REQUIRED_SKILLS: readonly ["brainstorming", "writing-plans", "subagent-driven-development", "test-driven-development", "verification-before-completion", "finishing-a-development-branch"];
export type SuperpowersRequiredSkill = (typeof SUPERPOWERS_REQUIRED_SKILLS)[number];
/**
 * openspec init 为各工具生成的 skill/command 标记文件。
 * 只要其中任意一个存在，就视为 openspec init 已成功执行过。
 * key = tool name，value = 相对项目根的路径列表（任意一个存在即可）
 */
export declare const OPENSPEC_INIT_MARKERS: Record<string, string[]>;
/** 各工具安装 Superpowers 的具体指引 */
export declare const SUPERPOWERS_INSTALL_HINTS: Record<string, string[]>;
/** 各工具 Superpowers 插件缓存目录 */
export declare const SUPERPOWERS_PLUGIN_CACHE_DIRS: Record<string, string>;
export declare const TOOL_PATHS: Record<string, {
    skillsDir: string;
    commandsDir?: string;
}>;
