import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface FormatRecord {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const formatsApi = {
  list: async (): Promise<FormatRecord[]> => {
    const res = await api.get("/formats");
    return res.data.data;
  },
  create: async (data: { title: string; description?: string; icon?: string; fileUrl: string }): Promise<FormatRecord> => {
    const res = await api.post("/formats", data);
    return res.data.data;
  }
};
