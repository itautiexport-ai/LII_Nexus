import { FlowchartTask, FlowchartTaskWithContext, RunStatus, WorkflowRun } from "../entities/Flowchart";

export interface IFlowchartRepository {
  createRun(data: { id: string; workflowId: string; reference: string; notes?: string | null; startedBy: string; firstStageId: string }): Promise<WorkflowRun>;
  listRuns(params: { page: number; pageSize: number; workflowId?: string; status?: RunStatus }): Promise<{ items: (WorkflowRun & { workflowName: string })[]; total: number }>;
  findRunById(id: string): Promise<WorkflowRun | null>;
  updateRunStatus(id: string, status: RunStatus): Promise<void>;

  findTaskById(id: string): Promise<FlowchartTask | null>;
  listTasksForRun(runId: string): Promise<FlowchartTaskWithContext[]>;
  listTasksForEmployee(employeeId: string, params?: { from?: string; to?: string }): Promise<FlowchartTaskWithContext[]>;
  assignTask(id: string, employeeId: string, assignedBy: string, dueDate: string | null): Promise<FlowchartTask>;
  updateTaskStatus(id: string, status: "running" | "completed", remarks?: string | null): Promise<FlowchartTask>;
  createNextStageTask(runId: string, stageId: string): Promise<FlowchartTask>;

  countCompletedAndTotalDue(employeeId: string, from: string, to: string): Promise<{ completed: number; total: number }>;
}
