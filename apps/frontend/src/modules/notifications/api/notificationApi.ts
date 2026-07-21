import { axiosInstance } from "../../../services/api/axiosInstance";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationStatus = "pending" | "actioned" | "dismissed";
export type NotificationModule = "office" | "factory" | "crm" | "workflow" | "general";

export interface NotificationRecord {
  id: string;
  notificationType: string;
  module: NotificationModule;
  referenceType: string | null;
  referenceId: string | null;
  title: string;
  description: string | null;
  priority: NotificationPriority;
  dueDate: string | null;
  status: NotificationStatus;
  isRead: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
  escalationLevel: number;
  createdAt: string;
}

export interface NotificationTemplateRecord {
  id: string;
  notificationType: string;
  module: NotificationModule;
  defaultTitle: string;
  defaultDescription: string | null;
  defaultPriority: NotificationPriority;
  defaultActionLabel: string | null;
  status: "active" | "inactive";
}

export interface EscalationRuleRecord {
  id: string;
  level: number;
  levelLabel: "supervisor" | "hod" | "coo" | "ceo";
  targetRoleId: string | null;
  escalateAfterHours: number;
}

export const notificationApi = {
  async list(params: { page?: number; pageSize?: number; status?: string; isRead?: boolean; module?: string } = {}) {
    const res = await axiosInstance.get("/notifications", { params: { page: 1, pageSize: 20, ...params } });
    return { items: res.data.data as NotificationRecord[], totalItems: res.data.meta.totalItems as number };
  },
  async unreadCount(): Promise<number> {
    const res = await axiosInstance.get("/notifications/unread-count");
    return res.data.data.count;
  },
  async markRead(id: string) {
    const res = await axiosInstance.patch(`/notifications/${id}/read`);
    return res.data.data;
  },
  async markAllRead() {
    const res = await axiosInstance.patch("/notifications/mark-all-read");
    return res.data.data.markedCount as number;
  },
  async updateStatus(id: string, status: NotificationStatus) {
    const res = await axiosInstance.patch(`/notifications/${id}/status`, { status });
    return res.data.data;
  },

  async listTemplates(): Promise<NotificationTemplateRecord[]> {
    const res = await axiosInstance.get("/notification-templates");
    return res.data.data;
  },
  async updateTemplate(id: string, payload: Partial<{ defaultTitle: string; defaultDescription: string | null; defaultPriority: NotificationPriority; defaultActionLabel: string | null; status: "active" | "inactive" }>) {
    const res = await axiosInstance.patch(`/notification-templates/${id}`, payload);
    return res.data.data as NotificationTemplateRecord;
  },

  async listEscalationRules(): Promise<EscalationRuleRecord[]> {
    const res = await axiosInstance.get("/escalation-rules");
    return res.data.data;
  },
  async updateEscalationRule(level: number, payload: Partial<{ targetRoleId: string | null; escalateAfterHours: number }>) {
    const res = await axiosInstance.patch(`/escalation-rules/${level}`, payload);
    return res.data.data as EscalationRuleRecord;
  },
  async runEscalationCheck() {
    const res = await axiosInstance.post("/notifications/run-escalation-check");
    return res.data.data;
  },
};
