export type NotificationType =
  | "new_task_assigned" | "task_due_today" | "task_overdue" | "workflow_stage_assigned" | "workflow_approved"
  | "workflow_rejected" | "delegation_assigned" | "delegation_extension_requested" | "delegation_extension_approved" | "delegation_extension_rejected" | "checklist_missed" | "daily_dpr_pending" | "factory_delay"
  | "machine_breakdown" | "crm_followup_due" | "crm_followup_missed" | "lead_assigned" | "lead_won" | "lead_lost"
  | "executive_meeting_reminder";

export type NotificationModule = "office" | "factory" | "crm" | "workflow" | "general";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationStatus = "pending" | "actioned" | "dismissed";
export type EscalationLevelLabel = "supervisor" | "hod" | "coo" | "ceo";
export type DeliveryChannel = "in_app" | "email" | "whatsapp" | "sms" | "push";

export interface NotificationTemplate {
  id: string;
  notificationType: NotificationType;
  module: NotificationModule;
  defaultTitle: string;
  defaultDescription: string | null;
  defaultPriority: NotificationPriority;
  defaultActionLabel: string | null;
  status: "active" | "inactive";
}

export interface Notification {
  id: string;
  notificationType: NotificationType;
  module: NotificationModule;
  referenceType: string | null;
  referenceId: string | null;
  title: string;
  description: string | null;
  priority: NotificationPriority;
  assignedUserId: string;
  createdBy: string | null;
  dueDate: string | null;
  status: NotificationStatus;
  isRead: boolean;
  readAt: Date | null;
  actionLabel: string | null;
  actionUrl: string | null;
  escalationLevel: number;
  lastEscalatedAt: Date | null;
  parentNotificationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationRule {
  id: string;
  level: number;
  levelLabel: EscalationLevelLabel;
  targetRoleId: string | null;
  escalateAfterHours: number;
}
