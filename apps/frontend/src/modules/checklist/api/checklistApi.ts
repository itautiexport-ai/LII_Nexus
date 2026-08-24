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

  getMyDashboard: async () => {
    const res = await axiosInstance.get<{ success: boolean; data: any }>("/standalone-checklists/my-dashboard");
    return res.data.data;
  },

  complete: async (id: string, notes?: string, attachmentUrl?: string) => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>(`/standalone-checklists/${id}/complete`, {
      notes,
      attachmentUrl,
    });
    return res.data;
  },

  uploadAttachment: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post<{ success: boolean; data: { fileUrl: string } }>("/standalone-checklists/upload-attachment", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data.fileUrl;
  }
};
