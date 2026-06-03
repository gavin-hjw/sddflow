export declare function exec(cmd: string, options?: {
    stdio?: 'inherit' | 'pipe';
}): string;
export declare function cmdExists(cmd: string): boolean;
export declare function fileExists(path: string): boolean;
export declare function dirExists(path: string): boolean;
