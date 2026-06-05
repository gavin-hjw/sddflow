export type ChangeWorkflowStatus = 'needs_brainstorming' | 'needs_spec' | 'needs_spec_plan' | 'ready_for_build' | 'build_in_progress' | 'ready_for_close';
export declare function findPlanFileForChange(cwd: string, changeName: string): string | null;
export declare function getPlanCheckboxStats(content: string): {
    total: number;
    done: number;
    complete: boolean;
};
export declare function getChangeWorkflowStatus(cwd: string, changeName: string): ChangeWorkflowStatus;
export declare function formatChangeWorkflowStatus(status: ChangeWorkflowStatus): string;
