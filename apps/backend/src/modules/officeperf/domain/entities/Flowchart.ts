export type RunStatus = "in_progress" | "completed" | "cancelled";
export type TaskBaseStatus = "pending" | "running" | "completed";
export type TaskDisplayStatus = "pending" | "running" | "completed" | "delayed";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  reference: string;
  notes: string | null;
  status: RunStatus;
  startedBy: string;
  startedAt: Date;
  completedAt: Date | null;
}

export interface FlowchartTask {
  id: string;
  workflowRunId: string;
  stageId: string;
  assignedTo: string | null;
  assignedBy: string | null;
  assignedAt: Date | null;
  dueDate: string | null;
  baseStatus: TaskBaseStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowchartTaskWithContext extends FlowchartTask {
  stageName: string;
  stageSequence: number;
  workflowName: string;
  runReference: string;
  assigneeName: string | null;
}

/** Delayed is derived, never stored, so it can't go stale: a task is only
 *  "delayed" if it's still open (not completed) and past its due date. */
export function computeDisplayStatus(task: Pick<FlowchartTask, "baseStatus" | "dueDate">): TaskDisplayStatus {
  if (task.baseStatus === "completed") return "completed";
  if (task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString())) return "delayed";
  return task.baseStatus;
}
