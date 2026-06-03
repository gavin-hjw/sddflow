import { execSync } from 'child_process';

export function exec(cmd: string, options?: { stdio?: 'inherit' | 'pipe' }): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: options?.stdio ?? 'pipe',
    }).trim();
  } catch {
    return '';
  }
}

import fs from 'fs';

export function cmdExists(cmd: string): boolean {
  // Windows: 用 where；Unix: 用 which
  const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
  try {
    execSync(checkCmd, { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function fileExists(path: string): boolean {
  try {
    return fs.existsSync(path) && fs.statSync(path).isFile();
  } catch {
    return false;
  }
}

export function dirExists(path: string): boolean {
  try {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
  } catch {
    return false;
  }
}
