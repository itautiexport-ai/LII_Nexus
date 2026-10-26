import { axiosInstance } from "../../../services/api/axiosInstance";

export interface ContactItem {
  id?: string;
  label: string; // e.g. "Primary Phone", "Mobile / WhatsApp", "Office Direct"
  number: string;
}

export interface BuyerDirectoryEntry {
  id: string;
  master_buyer_id: string | null;
  buyer_name: string;
  buyer_code: string | null;
  alias_name: string | null;
  country: string | null;
  city: string | null;
  existing_skus: number;
  annual_containers: number;
  monthly_containers: number;
  container_types: string | null; // JSON string or comma-separated
  email: string | null;
  sourcing_person: string | null;
  contact_details: string | null; // JSON string of ContactItem[]
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerDirectoryInput {
  master_buyer_id?: string | null;
  buyer_name: string;
  buyer_code?: string | null;
  alias_name?: string | null;
  country?: string | null;
  city?: string | null;
  existing_skus?: number | null;
  annual_containers?: number | null;
  monthly_containers?: number | null;
  container_types?: string[] | string | null;
  email?: string | null;
  sourcing_person?: string | null;
  contact_details?: ContactItem[] | string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export const buyerDirectoryApi = {
  async list(search?: string): Promise<BuyerDirectoryEntry[]> {
    const res = await axiosInstance.get("/crm/buyer-directory", {
      params: search ? { search } : undefined,
    });
    return res.data.data;
  },

  async getById(id: string): Promise<BuyerDirectoryEntry> {
    const res = await axiosInstance.get(`/crm/buyer-directory/${id}`);
    return res.data.data;
  },

  async create(data: BuyerDirectoryInput): Promise<BuyerDirectoryEntry> {
    const res = await axiosInstance.post("/crm/buyer-directory", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<BuyerDirectoryInput>): Promise<BuyerDirectoryEntry> {
    const res = await axiosInstance.put(`/crm/buyer-directory/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/crm/buyer-directory/${id}`);
  },
};
