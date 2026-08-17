import { axiosInstance } from "../../../../../services/api/axiosInstance";

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

export const departmentsApi = {
  async list(): Promise<DepartmentRecord[]> {
    const res = await axiosInstance.get("/departments");
    return res.data.data;
  },
  async listForDropdown(): Promise<{ id: string; name: string }[]> {
    const res = await axiosInstance.get("/departments/lookup");
    return res.data.data;
  },
  async create(payload: { name: string; code?: string; description?: string }) {
    const res = await axiosInstance.post("/departments", payload);
    return res.data.data as DepartmentRecord;
  },
  async update(id: string, payload: Partial<{ name: string; code: string | null; description: string | null }>) {
    const res = await axiosInstance.patch(`/departments/${id}`, payload);
    return res.data.data as DepartmentRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/departments/${id}`);
  },
};
