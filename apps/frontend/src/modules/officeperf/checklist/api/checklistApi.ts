import { axiosInstance } from "../../../../services/api/axiosInstance";

export type ChecklistFrequency = "daily" | "weekly" | "monthly";

export interface ChecklistTemplateRecord {
  id: string;
  title: string;
  description: string | null;
  frequency: ChecklistFrequency;
  status: "active" | "inactive";
}

export interface ChecklistAssignmentRecord {
  id: string;
  employeeId: string | null;
  roleId: string | null;
}

export interface ChecklistTemplateDetail extends ChecklistTemplateRecord {
  assignments: ChecklistAssignmentRecord[];
}

export interface ChecklistInstanceItemRecord {
  id: string;
  label: string;
  isChecked: boolean;
}

export interface ChecklistInstanceRecord {
  id: string;
  templateTitle: string;
  frequency: ChecklistFrequency;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  items: ChecklistInstanceItemRecord[];
}

export const checklistApi = {
  async listTemplates(params: { search?: string; frequency?: string; status?: string } = {}): Promise<ChecklistTemplateRecord[]> {
    const res = await axiosInstance.get("/checklists/templates", { params });
    return res.data.data;
  },
  async getTemplateDetail(id: string): Promise<ChecklistTemplateDetail> {
    const res = await axiosInstance.get(`/checklists/templates/${id}`);
    return res.data.data;
  },
  async createTemplate(payload: {
    title: string; description?: string; frequency: ChecklistFrequency;
    items: { label: string }[]; assignments?: { employeeId?: string | null; roleId?: string | null }[];
  }) {
    const res = await axiosInstance.post("/checklists/templates", payload);
    return res.data.data;
  },
  async updateTemplate(id: string, payload: Partial<{
    title: string; description: string | null; status: "active" | "inactive";
    items: { label: string }[]; assignments: { employeeId?: string | null; roleId?: string | null }[];
  }>) {
    const res = await axiosInstance.patch(`/checklists/templates/${id}`, payload);
    return res.data.data;
  },
  async deleteTemplate(id: string) {
    await axiosInstance.delete(`/checklists/templates/${id}`);
  },
  async getMyChecklists(): Promise<ChecklistInstanceRecord[]> {
    const res = await axiosInstance.get("/checklists/my-checklists");
    return res.data.data;
  },
  async setItemChecked(instanceId: string, itemId: string, checked: boolean): Promise<ChecklistInstanceRecord> {
    const res = await axiosInstance.patch(`/checklists/instances/${instanceId}/items/${itemId}`, { checked });
    return res.data.data;
  },
};
