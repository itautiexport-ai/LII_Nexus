import { axiosInstance } from "../../../services/api/axiosInstance";

export type WorkflowStatus = "draft" | "active" | "inactive" | "archived";
export type CompletionMode = "manual" | "approval_only" | "all_checklist_items" | "all_of_the_above";
export type NotificationTrigger = "on_stage_start" | "on_due_date" | "on_overdue" | "on_completion" | "on_escalation";
export type NotificationChannel = "email" | "sms" | "in_app";
export type NotificationRecipientType = "responsible_role" | "initiator" | "custom_role";
export type EscalationAction = "notify_only" | "reassign";

export interface ChecklistItemInput { label: string; }
export interface StageDocumentInput { documentName: string; isMandatory?: boolean; }
export interface NotificationRuleInput {
  triggerEvent: NotificationTrigger;
  channel?: NotificationChannel;
  recipientType?: NotificationRecipientType;
  customRoleId?: string | null;
  messageTemplate?: string | null;
}
export interface EscalationRuleInput {
  escalateAfterDays: number;
  escalateToRoleId: string;
  escalationAction?: EscalationAction;
  notes?: string | null;
}

export interface StageInput {
  name: string;
  responsibleRoleId: string;
  dueDays?: number | null;
  approvalRequired?: boolean;
  checklistRequired?: boolean;
  canSkip?: boolean;
  completionMode?: CompletionMode;
  minMandatoryDocuments?: number;
  checklistItems?: ChecklistItemInput[];
  mandatoryDocuments?: StageDocumentInput[];
  notificationRules?: NotificationRuleInput[];
  escalationRules?: EscalationRuleInput[];
}

export interface StageRecord extends StageInput {
  id: string;
  workflowId: string;
  sequence: number;
  checklistItems: (ChecklistItemInput & { id: string; sortOrder: number })[];
  mandatoryDocuments: (StageDocumentInput & { id: string })[];
  notificationRules: (NotificationRuleInput & { id: string })[];
  escalationRules: (EscalationRuleInput & { id: string })[];
}

export interface WorkflowSummary {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  description: string | null;
  status: WorkflowStatus;
  version: number;
  stageCount: number;
  updatedAt: string;
}

export interface WorkflowDetail extends WorkflowSummary {
  stages: StageRecord[];
}

export const workflowApi = {
  async list(params: { search?: string; departmentId?: string; status?: string; page?: number; pageSize?: number }) {
    const res = await axiosInstance.get("/workflows", { params: { page: 1, pageSize: 20, ...params } });
    return { items: res.data.data as WorkflowSummary[], totalItems: res.data.meta.totalItems as number };
  },
  async getById(id: string): Promise<WorkflowDetail> {
    const res = await axiosInstance.get(`/workflows/${id}`);
    return res.data.data;
  },
  async create(payload: { name: string; departmentId?: string | null; description?: string | null; stages?: StageInput[] }): Promise<WorkflowDetail> {
    const res = await axiosInstance.post("/workflows", payload);
    return res.data.data;
  },
  async updateMeta(id: string, payload: { name?: string; departmentId?: string | null; description?: string | null }) {
    const res = await axiosInstance.patch(`/workflows/${id}`, payload);
    return res.data.data;
  },
  async updateStatus(id: string, status: WorkflowStatus) {
    const res = await axiosInstance.patch(`/workflows/${id}/status`, { status });
    return res.data.data;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/workflows/${id}`);
  },
  async addStage(workflowId: string, stage: StageInput): Promise<StageRecord> {
    const res = await axiosInstance.post(`/workflows/${workflowId}/stages`, stage);
    return res.data.data;
  },
  async updateStage(workflowId: string, stageId: string, stage: StageInput): Promise<StageRecord> {
    const res = await axiosInstance.patch(`/workflows/${workflowId}/stages/${stageId}`, stage);
    return res.data.data;
  },
  async removeStage(workflowId: string, stageId: string) {
    await axiosInstance.delete(`/workflows/${workflowId}/stages/${stageId}`);
  },
  async reorderStages(workflowId: string, stageIds: string[]): Promise<WorkflowDetail> {
    const res = await axiosInstance.patch(`/workflows/${workflowId}/stages/reorder`, { stageIds });
    return res.data.data;
  },
};
