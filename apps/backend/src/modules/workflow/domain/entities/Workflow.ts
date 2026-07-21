export type WorkflowStatus = "draft" | "active" | "inactive" | "archived";
export type CompletionMode = "manual" | "approval_only" | "all_checklist_items" | "all_of_the_above";
export type NotificationTrigger = "on_stage_start" | "on_due_date" | "on_overdue" | "on_completion" | "on_escalation";
export type NotificationChannel = "email" | "sms" | "in_app";
export type NotificationRecipientType = "responsible_role" | "initiator" | "custom_role";
export type EscalationAction = "notify_only" | "reassign";

export interface ChecklistItem {
  id: string;
  label: string;
  sortOrder: number;
}

export interface StageDocument {
  id: string;
  documentName: string;
  isMandatory: boolean;
}

export interface NotificationRule {
  id: string;
  triggerEvent: NotificationTrigger;
  channel: NotificationChannel;
  recipientType: NotificationRecipientType;
  customRoleId: string | null;
  messageTemplate: string | null;
}

export interface EscalationRule {
  id: string;
  escalateAfterDays: number;
  escalateToRoleId: string;
  escalationAction: EscalationAction;
  notes: string | null;
}

export interface WorkflowStage {
  id: string;
  workflowId: string;
  name: string;
  sequence: number;
  responsibleRoleId: string;
  dueDays: number | null;
  approvalRequired: boolean;
  checklistRequired: boolean;
  canSkip: boolean;
  completionMode: CompletionMode;
  minMandatoryDocuments: number;
  checklistItems: ChecklistItem[];
  mandatoryDocuments: StageDocument[];
  notificationRules: NotificationRule[];
  escalationRules: EscalationRule[];
}

export interface Workflow {
  id: string;
  name: string;
  departmentId: string | null;
  description: string | null;
  status: WorkflowStatus;
  version: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkflowWithStages extends Workflow {
  stages: WorkflowStage[];
}

export interface WorkflowSummary extends Workflow {
  departmentName: string | null;
  stageCount: number;
}
