import { axiosInstance } from "../../../../../services/api/axiosInstance";

export interface ShiftRecord {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
}

export const shiftsApi = {
  async list(): Promise<ShiftRecord[]> {
    const res = await axiosInstance.get("/shifts");
    return res.data.data;
  },
  async create(payload: { name: string; startTime?: string; endTime?: string }) {
    const res = await axiosInstance.post("/shifts", payload);
    return res.data.data as ShiftRecord;
  },
  async update(id: string, payload: Partial<{ name: string; startTime: string; endTime: string }>) {
    const res = await axiosInstance.patch(`/shifts/${id}`, payload);
    return res.data.data as ShiftRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/shifts/${id}`);
  },
};
