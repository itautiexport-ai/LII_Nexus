import { axiosInstance } from "../../../../../services/api/axiosInstance";

export interface ContractorRecord {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive";
}

export const contractorsApi = {
  async list(): Promise<ContractorRecord[]> {
    const res = await axiosInstance.get("/contractors");
    return res.data.data;
  },
  async create(payload: { name: string; contactPerson?: string; phone?: string; email?: string }) {
    const res = await axiosInstance.post("/contractors", payload);
    return res.data.data as ContractorRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/contractors/${id}`);
  },
};
