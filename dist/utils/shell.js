import { execSync } from 'child_process';
export function exec(cmd, options) {
    try {
        return execSync(cmd, {
            encoding: 'utf-8',
            stdio: options?.stdio ?? 'pipe',
            cwd: options?.cwd,
        }).trim();
    }
    catch {
        return '';
    }
}
export function execOrThrow(cmd, options) {
    execSync(cmd, {
        encoding: 'utf-8',
        stdio: options?.stdio ?? 'inherit',
        cwd: options?.cwd,
    });
}
import fs from 'fs';
export function cmdExists(cmd) {
    // Windows: 用 where；Unix: 用 which
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    try {
        execSync(checkCmd, { encoding: 'utf-8', stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
export function fileExists(path) {
    try {
        return fs.existsSync(path) && fs.statSync(path).isFile();
    }
    catch {
        return false;
    }
}
export function dirExists(path) {
    try {
        return fs.existsSync(path) && fs.statSync(path).isDirectory();
    }
    catch {
        return false;
    }
}
