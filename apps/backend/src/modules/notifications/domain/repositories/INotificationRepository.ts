import { DeliveryChannel, EscalationRule, Notification, NotificationModule, NotificationPriority, NotificationStatus, NotificationTemplate, NotificationType } from "../entities/Notification";

export interface CreateNotificationData {
  id: string;
  notificationType: NotificationType;
  module: NotificationModule;
  referenceType?: string | null;
  referenceId?: string | null;
  title: string;
  description?: string | null;
  priority: NotificationPriority;
  assignedUserId: string;
  createdBy?: string | null;
  dueDate?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  parentNotificationId?: string | null;
  escalationLevel?: number;
}

export interface ListNotificationsParams {
  page: number;
  pageSize: number;
  assignedUserId?: string;
  status?: NotificationStatus;
  isRead?: boolean;
  module?: NotificationModule;
  priority?: NotificationPriority;
}

export interface INotificationRepository {
  listTemplates(): Promise<NotificationTemplate[]>;
  findTemplateByType(type: NotificationType): Promise<NotificationTemplate | null>;
  updateTemplate(id: string, changes: { defaultTitle?: string; defaultDescription?: string | null; defaultPriority?: NotificationPriority; defaultActionLabel?: string | null; status?: "active" | "inactive" }): Promise<NotificationTemplate>;

  listEscalationRules(): Promise<EscalationRule[]>;
  updateEscalationRule(level: number, changes: { targetRoleId?: string | null; escalateAfterHours?: number }): Promise<EscalationRule>;

  create(data: CreateNotificationData): Promise<Notification>;
  list(params: ListNotificationsParams): Promise<{ items: Notification[]; total: number }>;
  findById(id: string): Promise<Notification | null>;
  countUnread(assignedUserId: string): Promise<number>;
  markRead(id: string): Promise<Notification>;
  markAllRead(assignedUserId: string): Promise<number>;
  updateStatus(id: string, status: NotificationStatus): Promise<Notification>;
  bumpEscalation(id: string, newLevel: number): Promise<void>;

  listPendingUnescalatedOlderThan(level: number, hours: number): Promise<Notification[]>;
  recordDelivery(notificationId: string, channel: DeliveryChannel, status: "delivered" | "simulated" | "failed"): Promise<void>;
}
