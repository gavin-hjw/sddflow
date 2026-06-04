import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import {
  checkDependencies,
  readState,
  verifyOpenSpecInitIntegrity,
} from '../core/dependency-check.js';
import { logger } from '../utils/logger.js';
import { dirExists } from '../utils/shell.js';

export const statusCommand = new Command('status')
  .description('Show dependency status and active changes')
  .action(() => {
    const cwd = process.cwd();

    logger.blank();
    logger.info('sddflow status');
    logger.blank();

    const state = readState(cwd);

    logger.step('Dependencies:');
    const depStatus = checkDependencies({ cwd, tools: state?.tools });

    if (depStatus.openspec.installed) {
      logger.success(`OpenSpec CLI${depStatus.openspec.version ? ` v${depStatus.openspec.version}` : ''}`);
    } else {
      logger.warn('OpenSpec CLI — not installed');
    }

    if (depStatus.superpowers.pluginInstalled) {
      logger.success('Superpowers plugin');
    } else {
      logger.warn('Superpowers plugin — not installed');
    }

    for (const skill of depStatus.superpowers.skills) {
      if (skill.installed) {
        logger.success(`  /${skill.name}${skill.path ? ` (${skill.path})` : ''}`);
      } else {
        logger.warn(`  /${skill.name} — missing`);
      }
    }

    logger.blank();

    logger.step('Project:');

    if (state) {
      logger.success(`Initialized (${state.tools.join(', ')})`);
      logger.info(`  Created at: ${state.createdAt}`);
    } else {
      logger.warn('Not initialized — run sddflow init');
      return;
    }

    const integrity = verifyOpenSpecInitIntegrity(cwd, state.tools);
    if (integrity.ok) {
      logger.success('OpenSpec project initialized (integrity OK)');
    } else {
      logger.warn(`OpenSpec init incomplete — missing ${integrity.missing.length} file(s)`);
      for (const file of integrity.missing) {
        logger.info(`  - ${file}`);
      }
    }

    logger.blank();

    logger.step('Active changes:');
    const changesDir = path.join(cwd, 'openspec', 'changes');

    if (!dirExists(changesDir)) {
      logger.info('  None');
      return;
    }

    const entries = fs.readdirSync(changesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'archive');

    if (entries.length === 0) {
      logger.info('  None');
      return;
    }

    for (const entry of entries) {
      const changeDir = path.join(changesDir, entry.name);
      const hasPlanReady = fs.existsSync(path.join(changeDir, 'plan-ready.md'));
      const hasProposal = fs.existsSync(path.join(changeDir, 'proposal.md'));

      let status = '';
      if (hasPlanReady) {
        status = '→ ready for /sddflow build or /sddflow amend';
      } else if (hasProposal) {
        status = '→ needs /sddflow spec';
      } else {
        status = '→ needs /sddflow proposal';
      }

      logger.info(`  ${entry.name} ${status}`);
    }

    logger.blank();
  });
