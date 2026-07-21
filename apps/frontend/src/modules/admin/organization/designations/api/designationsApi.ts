import { axiosInstance } from "../../../../../services/api/axiosInstance";

export interface DesignationRecord {
  id: string;
  title: string;
  description: string | null;
}

export const designationsApi = {
  async list(): Promise<DesignationRecord[]> {
    const res = await axiosInstance.get("/designations");
    return res.data.data;
  },
  async create(payload: { title: string; description?: string }) {
    const res = await axiosInstance.post("/designations", payload);
    return res.data.data as DesignationRecord;
  },
  async update(id: string, payload: Partial<{ title: string; description: string | null }>) {
    const res = await axiosInstance.patch(`/designations/${id}`, payload);
    return res.data.data as DesignationRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/designations/${id}`);
  },
};
