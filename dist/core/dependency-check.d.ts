import { type SuperpowersRequiredSkill } from './constants.js';
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
export declare function checkDependencies(options?: CheckDependencyOptions): DepStatus;
export declare function checkSuperpowersSkills(cwd: string, home: string, tools: string[]): SuperpowersSkillStatus[];
/** 阶段 1：检测 OpenSpec CLI + Superpowers 插件是否已安装 */
export declare function validateComponentInstallation(depStatus: DepStatus, tools: string[]): InitPrerequisiteFailure[];
/** 阶段 2：检测 Superpowers 必需 skills 是否齐全 */
export declare function validateSuperpowersSkills(depStatus: DepStatus, tools: string[]): InitPrerequisiteFailure[];
export declare function verifyOpenSpecInitIntegrity(cwd: string, tools: string[]): IntegrityCheckResult;
export declare function runOpenSpecInit(cwd: string, tools: string[]): boolean;
export declare function printInitPrerequisiteFailures(failures: InitPrerequisiteFailure[], title?: string): void;
export declare function printIntegrityFailures(result: IntegrityCheckResult, tools: string[]): void;
export declare function tryAutoInstall(pkg: string): boolean;
export declare function checkOpenSpecInitialized(cwd: string): boolean;
export interface InitState {
    openspec: boolean;
    superpowers: boolean;
    openspecProjectInitialized: boolean;
    createdAt: string;
    tools: string[];
}
export declare function readState(cwd: string): InitState | null;
export declare function writeState(cwd: string, state: InitState): void;
