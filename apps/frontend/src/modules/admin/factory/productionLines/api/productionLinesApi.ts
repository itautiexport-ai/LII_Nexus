import { axiosInstance } from "../../../../../services/api/axiosInstance";

export interface ProductionLineRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

export const productionLinesApi = {
  async list(): Promise<ProductionLineRecord[]> {
    const res = await axiosInstance.get("/production-lines");
    return res.data.data;
  },
  async create(payload: { name: string; code?: string; description?: string }) {
    const res = await axiosInstance.post("/production-lines", payload);
    return res.data.data as ProductionLineRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/production-lines/${id}`);
  },
};
