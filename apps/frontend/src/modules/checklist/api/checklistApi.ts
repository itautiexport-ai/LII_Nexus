import { axiosInstance } from "../../../services/api/axiosInstance";

export interface CreateStandaloneChecklistDto {
  taskName: string;
  assignBy: string;
  assignTo: string;
  plannedDate: string;
  priority: "Low" | "Medium" | "High";
  makeAttachmentMandatory: boolean;
  makeNoteMandatory: boolean;
  mode: string;
  frequency: string;
  whenRule?: string;
  remindBeforeDays: number;
  skipOnHolidays: boolean;
}

export interface StandaloneChecklist extends CreateStandaloneChecklistDto {
  id: string;
  assignedBy: string;
  assigner_name?: string;
  assignee_name?: string;
  createdAt: string;
  updatedAt: string;
}

export const standaloneChecklistApi = {
  getAll: async () => {
    const res = await axiosInstance.get<{ success: boolean; data: StandaloneChecklist[] }>("/standalone-checklists");
    return res.data.data;
  },

  create: async (data: CreateStandaloneChecklistDto) => {
    const res = await axiosInstance.post<{ success: boolean; data: StandaloneChecklist }>("/standalone-checklists", data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await axiosInstance.delete<{ success: boolean; message: string }>(`/standalone-checklists/${id}`);
    return res.data;
  },

  complete: async (id: string) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(`/standalone-checklists/${id}/complete`);
    return res.data;
  },

  bulkDelete: async (ids: string[]) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>("/standalone-checklists/bulk-delete", { ids });
    return res.data;
  },

  downloadBulkTemplate: async () => {
    const res = await axiosInstance.get("/standalone-checklists/bulk-template", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Checklist_Bulk_Upload_Template.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  bulkUpload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post("/standalone-checklists/bulk-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
};
