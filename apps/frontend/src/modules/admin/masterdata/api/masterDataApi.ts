import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface WoodType {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Priority {
  id: string;
  name: string;
  colorCode: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Uom {
  id: string;
  name: string;
  createdAt: string;
}

export interface Hod {
  id: string;
  name: string;
  createdAt?: string;
  created_at?: string;
}

export interface Merchant {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export interface FinishCode {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  buyer_code?: string | null;
  alias_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const masterDataApi = {
  // Wood Types
  async getWoodTypes(): Promise<WoodType[]> {
    const res = await axiosInstance.get("/wood-types");
    return res.data.data;
  },
  async createWoodType(name: string): Promise<WoodType> {
    const res = await axiosInstance.post("/wood-types", { name });
    return res.data.data;
  },
  async updateWoodType(id: string, name: string, status: "active" | "inactive"): Promise<WoodType> {
    const res = await axiosInstance.put(`/wood-types/${id}`, { name, status });
    return res.data.data;
  },
  async deleteWoodType(id: string): Promise<void> {
    await axiosInstance.delete(`/wood-types/${id}`);
  },

  // Priorities
  async getPriorities(): Promise<Priority[]> {
    const res = await axiosInstance.get("/priorities");
    return res.data.data;
  },
  async createPriority(name: string, colorCode: string): Promise<Priority> {
    const res = await axiosInstance.post("/priorities", { name, colorCode });
    return res.data.data;
  },
  async updatePriority(id: string, name: string, colorCode: string, status: "active" | "inactive"): Promise<Priority> {
    const res = await axiosInstance.put(`/priorities/${id}`, { name, colorCode, status });
    return res.data.data;
  },
  async deletePriority(id: string): Promise<void> {
    await axiosInstance.delete(`/priorities/${id}`);
  },

  // Buyers
  async getBuyers(): Promise<Buyer[]> {
    const res = await axiosInstance.get("/buyers");
    return res.data.data;
  },
  async createBuyer(payload: string | { name: string; buyer_code?: string | null; alias_name?: string | null }): Promise<Buyer> {
    const body = typeof payload === "string" ? { name: payload } : payload;
    const res = await axiosInstance.post("/buyers", body);
    return res.data.data;
  },
  async updateBuyer(id: string, payload: string | { name: string; buyer_code?: string | null; alias_name?: string | null }): Promise<Buyer> {
    const body = typeof payload === "string" ? { name: payload } : payload;
    const res = await axiosInstance.put(`/buyers/${id}`, body);
    return res.data.data;
  },
  async deleteBuyer(id: string): Promise<void> {
    await axiosInstance.delete(`/buyers/${id}`);
  },

  // UOMs
  async getUoms(): Promise<Uom[]> {
    const res = await axiosInstance.get("/uoms");
    return res.data.data;
  },
  async createUom(name: string): Promise<Uom> {
    const res = await axiosInstance.post("/uoms", { name });
    return res.data.data;
  },
  async updateUom(id: string, name: string): Promise<Uom> {
    const res = await axiosInstance.put(`/uoms/${id}`, { name });
    return res.data.data;
  },
  async deleteUom(id: string): Promise<void> {
    await axiosInstance.delete(`/uoms/${id}`);
  },

  // HODs
  async getHods(): Promise<Hod[]> {
    const res = await axiosInstance.get("/hods");
    return res.data.data;
  },
  async createHod(name: string): Promise<Hod> {
    const res = await axiosInstance.post("/hods", { name });
    return res.data.data;
  },
  async updateHod(id: string, name: string): Promise<Hod> {
    const res = await axiosInstance.put(`/hods/${id}`, { name });
    return res.data.data;
  },
  async deleteHod(id: string): Promise<void> {
    await axiosInstance.delete(`/hods/${id}`);
  },

  // Merchants
  async getMerchants(): Promise<Merchant[]> {
    const res = await axiosInstance.get("/merchants");
    return res.data.data;
  },

  // Finish Codes
  async getFinishCodes(): Promise<FinishCode[]> {
    const res = await axiosInstance.get("/finish-codes");
    return res.data.data;
  },
  async createFinishCode(code: string, name: string): Promise<FinishCode> {
    const res = await axiosInstance.post("/finish-codes", { code, name });
    return res.data.data;
  },
  async updateFinishCode(id: string, code: string, name: string): Promise<FinishCode> {
    const res = await axiosInstance.put(`/finish-codes/${id}`, { code, name });
    return res.data.data;
  },
  async deleteFinishCode(id: string): Promise<void> {
    await axiosInstance.delete(`/finish-codes/${id}`);
  },

  // QC Names
  async getQcNames(): Promise<QcName[]> {
    const res = await axiosInstance.get("/qc-names");
    return res.data.data;
  },
  async createQcName(name: string): Promise<QcName> {
    const res = await axiosInstance.post("/qc-names", { name });
    return res.data.data;
  },
  async updateQcName(id: string, name: string): Promise<QcName> {
    const res = await axiosInstance.put(`/qc-names/${id}`, { name });
    return res.data.data;
  },
  async deleteQcName(id: string): Promise<void> {
    await axiosInstance.delete(`/qc-names/${id}`);
  },
};

export interface QcName {
  id: string;
  name: string;
  createdAt?: string;
}
