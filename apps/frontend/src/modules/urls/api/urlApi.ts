import { axiosInstance } from "../../../services/api/axiosInstance";

export interface UrlRecord {
  id: string;
  title: string;
  url: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const urlApi = {
  async list(): Promise<UrlRecord[]> {
    return (await axiosInstance.get("/important-urls")).data.data;
  },

  async create(payload: { title: string; url: string }): Promise<UrlRecord> {
    return (await axiosInstance.post("/important-urls", payload)).data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/important-urls/${id}`);
  }
};
