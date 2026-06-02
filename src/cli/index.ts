import { Command } from 'commander';
import { createRequire } from 'module';
import { initCommand } from './init.js';
import { statusCommand } from './status.js';
import { updateCommand } from './update.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

export function run(): void {
  const program = new Command();

  program
    .name('sddflow')
    .description('OpenSpec + Superpowers workflow orchestrator (SDDFlow)')
    .version(pkg.version);

  program.addCommand(initCommand);
  program.addCommand(statusCommand);
  program.addCommand(updateCommand);

  program.parse();
}
