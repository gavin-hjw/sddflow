import type { DepStatus } from './dependency-check.js';
export interface GenerateOptions {
    cwd: string;
    tools: string[];
    depStatus: DepStatus;
    global?: boolean;
}
export declare function generateSkills(options: GenerateOptions): void;
