export interface DepStatus {
    openspec: {
        installed: boolean;
        version?: string;
        autoInstalled?: boolean;
    };
    superpowers: {
        installed: boolean;
        hint?: string;
        path?: string;
        checkedPaths: string[];
    };
}
export interface CheckDependencyOptions {
    cwd?: string;
    tools?: string[];
}
export declare function checkDependencies(options?: CheckDependencyOptions): DepStatus;
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
