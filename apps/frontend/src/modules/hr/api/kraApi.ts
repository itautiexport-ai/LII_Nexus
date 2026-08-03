import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface KraRecord {
  id: string;
  department_id: string;
  designation_id: string | null;
  title: string;
  description: string | null;
  attachment_url: string | null;
  created_at: string;
}

export const kraApi = {
  getAll: async (departmentId?: string): Promise<KraRecord[]> => {
    const params = departmentId ? { departmentId } : {};
    const res = await api.get("/hr/kras", { params });
    return res.data.data;
  },
  create: async (data: { departmentId: string; designationId?: string; title: string; description?: string; attachmentUrl?: string }): Promise<KraRecord> => {
    const res = await api.post("/hr/kras", data);
    return res.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/hr/kras/${id}`);
  }
};
