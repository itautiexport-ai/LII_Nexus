import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface MerchantRecord {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export const merchantsApi = {
  async list() {
    const res = await axiosInstance.get("/merchants");
    return res.data.data as MerchantRecord[];
  },
  async create(name: string, status: string = 'active') {
    const res = await axiosInstance.post("/merchants", { name, status });
    return res.data.data as MerchantRecord;
  },
  async update(id: string, name: string, status: string) {
    const res = await axiosInstance.put(`/merchants/${id}`, { name, status });
    return res.data.data as MerchantRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/merchants/${id}`);
  }
};
