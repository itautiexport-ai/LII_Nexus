import {
  CompletionMode,
  EscalationAction,
  NotificationChannel,
  NotificationRecipientType,
  NotificationTrigger,
  Workflow,
  WorkflowStage,
  WorkflowStatus,
  WorkflowSummary,
  WorkflowWithStages,
} from "../entities/Workflow";

export interface StageInput {
  name: string;
  responsibleRoleId: string;
  dueDays?: number | null;
  approvalRequired?: boolean;
  checklistRequired?: boolean;
  canSkip?: boolean;
  completionMode?: CompletionMode;
  minMandatoryDocuments?: number;
  checklistItems?: { label: string }[];
  mandatoryDocuments?: { documentName: string; isMandatory?: boolean }[];
  notificationRules?: {
    triggerEvent: NotificationTrigger;
    channel?: NotificationChannel;
    recipientType?: NotificationRecipientType;
    customRoleId?: string | null;
    messageTemplate?: string | null;
  }[];
  escalationRules?: {
    escalateAfterDays: number;
    escalateToRoleId: string;
    escalationAction?: EscalationAction;
    notes?: string | null;
  }[];
}

export interface CreateWorkflowData {
  id: string;
  name: string;
  departmentId?: string | null;
  description?: string | null;
  createdBy: string | null;
  stages?: StageInput[];
}

export interface UpdateWorkflowMetaData {
  name?: string;
  departmentId?: string | null;
  description?: string | null;
}

export interface ListWorkflowsParams {
  page: number;
  pageSize: number;
  search?: string;
  departmentId?: string;
  status?: WorkflowStatus;
}

export interface IWorkflowRepository {
  list(params: ListWorkflowsParams): Promise<{ items: WorkflowSummary[]; total: number }>;
  findById(id: string): Promise<Workflow | null>;
  findByIdWithStages(id: string): Promise<WorkflowWithStages | null>;
  create(data: CreateWorkflowData): Promise<WorkflowWithStages>;
  updateMeta(id: string, changes: UpdateWorkflowMetaData): Promise<Workflow>;
  updateStatus(id: string, status: WorkflowStatus): Promise<Workflow>;
  incrementVersion(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  addStage(workflowId: string, stage: StageInput, sequence: number): Promise<WorkflowStage>;
  updateStage(workflowId: string, stageId: string, stage: StageInput): Promise<WorkflowStage>;
  removeStage(workflowId: string, stageId: string): Promise<void>;
  reorderStages(workflowId: string, orderedStageIds: string[]): Promise<void>;
  getStage(workflowId: string, stageId: string): Promise<WorkflowStage | null>;
}
