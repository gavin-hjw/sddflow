import fs from 'fs';
import path from 'path';
import { dirExists } from '../utils/shell.js';
const PLANS_DIR = 'docs/superpowers/plans';
export function findPlanFileForChange(cwd, changeName) {
    const plansDir = path.join(cwd, PLANS_DIR);
    if (!dirExists(plansDir))
        return null;
    const suffix = `-${changeName}.md`;
    const entries = fs.readdirSync(plansDir, { withFileTypes: true }).filter((e) => e.isFile());
    const match = entries.find((e) => e.name.endsWith(suffix) || e.name.includes(changeName));
    return match ? path.join(plansDir, match.name) : null;
}
export function getPlanCheckboxStats(content) {
    const checkboxRe = /^-\s+\[([ xX])\]/gm;
    let total = 0;
    let done = 0;
    let m;
    while ((m = checkboxRe.exec(content)) !== null) {
        total += 1;
        if (m[1].toLowerCase() === 'x')
            done += 1;
    }
    return {
        total,
        done,
        complete: total > 0 && done === total,
    };
}
export function getChangeWorkflowStatus(cwd, changeName) {
    const changeDir = path.join(cwd, 'openspec', 'changes', changeName);
    const hasProposal = fs.existsSync(path.join(changeDir, 'proposal.md'));
    const hasPlanReady = fs.existsSync(path.join(changeDir, 'plan-ready.md'));
    const planPath = findPlanFileForChange(cwd, changeName);
    if (!hasProposal)
        return 'needs_brainstorming';
    if (!hasPlanReady)
        return 'needs_spec';
    if (!planPath)
        return 'needs_spec_plan';
    const planContent = fs.readFileSync(planPath, 'utf-8');
    const { total, done, complete } = getPlanCheckboxStats(planContent);
    if (total === 0)
        return 'needs_spec_plan';
    if (complete)
        return 'ready_for_close';
    if (done > 0)
        return 'build_in_progress';
    return 'ready_for_build';
}
export function formatChangeWorkflowStatus(status) {
    switch (status) {
        case 'needs_brainstorming':
            return '→ needs /sddflow brainstorming';
        case 'needs_spec':
            return '→ needs /sddflow spec';
        case 'needs_spec_plan':
            return '→ needs /sddflow spec (missing plan-ready or docs/superpowers/plans)';
        case 'ready_for_build':
            return '→ ready for /sddflow build';
        case 'build_in_progress':
            return '→ build in progress (/sddflow build to resume)';
        case 'ready_for_close':
            return '→ ready for /sddflow close';
    }
}
