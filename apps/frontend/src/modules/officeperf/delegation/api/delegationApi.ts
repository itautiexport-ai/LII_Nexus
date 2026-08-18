import { axiosInstance } from "../../../../services/api/axiosInstance";

export type DelegationPriority = "low" | "medium" | "high" | "urgent";
export type DelegationDisplayStatus = "pending" | "running" | "completed" | "delayed";

export interface DelegatedTaskFileRecord {
  id: string;
  kind: "attachment" | "proof";
  fileName: string;
  fileUrl: string;
}

export interface DelegatedTaskRecord {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string;
  assignedBy: string;
  assignedByName: string;
  assignedToName: string;
  dueDate: string;
  priority: DelegationPriority;
  baseStatus: string;
  remarks: string | null;
  escalatedToName: string | null;
  extensionStatus: "none" | "pending" | "approved" | "rejected";
  extensionReason: string | null;
  extensionRequestedDate: string | null;
  extensionRejectionReason: string | null;
  files: DelegatedTaskFileRecord[];
}

function computeDisplayStatus(t: Pick<DelegatedTaskRecord, "baseStatus" | "dueDate">): DelegationDisplayStatus {
  if (t.baseStatus === "completed") return "completed";
  if (new Date(t.dueDate) < new Date(new Date().toDateString())) return "delayed";
  return t.baseStatus as DelegationDisplayStatus;
}

export const delegationApi = {
  async list(params: { page?: number; pageSize?: number; status?: string } = {}) {
    const res = await axiosInstance.get("/delegation/tasks", { params: { page: 1, pageSize: 50, ...params } });
    const items = (res.data.data as DelegatedTaskRecord[]).map((t) => ({ ...t, displayStatus: computeDisplayStatus(t) }));
    return { items, totalItems: res.data.meta.totalItems as number };
  },
  async listIDelegated(): Promise<(DelegatedTaskRecord & { displayStatus: DelegationDisplayStatus })[]> {
    const res = await axiosInstance.get("/delegation/i-delegated");
    return (res.data.data as DelegatedTaskRecord[]).map((t) => ({ ...t, displayStatus: computeDisplayStatus(t) }));
  },
  async create(payload: { title: string; description?: string; assignedBy?: string; assignedTo: string; dueDate: string; priority?: DelegationPriority; remarks?: string; sendAppNotification?: boolean; sendWhatsappNotification?: boolean; }) {
    const res = await axiosInstance.post("/delegation/tasks", payload);
    return res.data.data;
  },
  async update(id: string, payload: { title?: string; description?: string; dueDate?: string; priority?: DelegationPriority; remarks?: string }) {
    const res = await axiosInstance.patch(`/delegation/tasks/${id}`, payload);
    return res.data.data;
  },
  async updateStatus(id: string, status: "running" | "completed") {
    const res = await axiosInstance.patch(`/delegation/tasks/${id}/status`, { status });
    return res.data.data;
  },
  async escalate(id: string, escalateTo: string, notes?: string) {
    const res = await axiosInstance.patch(`/delegation/tasks/${id}/escalate`, { escalateTo, notes });
    return res.data.data;
  },
  async addFile(id: string, kind: "attachment" | "proof", fileName: string, fileUrl: string) {
    const res = await axiosInstance.post(`/delegation/tasks/${id}/files`, { kind, fileName, fileUrl });
    return res.data.data;
  },
  async uploadFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/delegation/tasks/${id}`);
  },
  async sendWhatsAppReminder(id: string) {
    const res = await axiosInstance.post(`/delegation/tasks/${id}/whatsapp`);
    return res.data;
  },
  async requestExtension(id: string, reason: string, requestedDate: string) {
    const res = await axiosInstance.post(`/delegation/tasks/${id}/extension`, { reason, requestedDate });
    return res.data.data;
  },
  async respondToExtension(id: string, status: "approved" | "rejected", rejectionReason?: string, updatedDate?: string) {
    const res = await axiosInstance.post(`/delegation/tasks/${id}/extension-response`, { status, rejectionReason, updatedDate });
    return res.data.data;
  }
};
