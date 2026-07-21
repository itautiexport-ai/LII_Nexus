import { axiosInstance } from "../../../../services/api/axiosInstance";

export type TaskDisplayStatus = "pending" | "running" | "completed" | "delayed";
export type RunStatus = "in_progress" | "completed" | "cancelled";

export interface FlowchartTaskRecord {
  id: string;
  workflowRunId: string;
  stageId: string;
  stageName: string;
  stageSequence: number;
  workflowName: string;
  runReference: string;
  assignedTo: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  baseStatus: string;
  displayStatus: TaskDisplayStatus;
  remarks: string | null;
}

export interface WorkflowRunRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  reference: string;
  notes: string | null;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
}

export interface WorkflowRunDetail extends WorkflowRunRecord {
  tasks: FlowchartTaskRecord[];
}

export const flowchartApi = {
  async listRuns(params: { page?: number; pageSize?: number; workflowId?: string; status?: string }) {
    const res = await axiosInstance.get("/flowchart/runs", { params: { page: 1, pageSize: 20, ...params } });
    return { items: res.data.data as WorkflowRunRecord[], totalItems: res.data.meta.totalItems as number };
  },
  async getRunDetail(id: string): Promise<WorkflowRunDetail> {
    const res = await axiosInstance.get(`/flowchart/runs/${id}`);
    return res.data.data;
  },
  async startRun(payload: { workflowId: string; reference: string; notes?: string }): Promise<WorkflowRunRecord> {
    const res = await axiosInstance.post("/flowchart/runs", payload);
    return res.data.data;
  },
  async listMyTasks(): Promise<FlowchartTaskRecord[]> {
    const res = await axiosInstance.get("/flowchart/my-tasks");
    return res.data.data;
  },
  async assignTask(taskId: string, employeeId: string) {
    const res = await axiosInstance.patch(`/flowchart/tasks/${taskId}/assign`, { employeeId });
    return res.data.data;
  },
  async updateTaskStatus(taskId: string, status: "running" | "completed", remarks?: string) {
    const res = await axiosInstance.patch(`/flowchart/tasks/${taskId}/status`, { status, remarks });
    return res.data.data;
  },
};
