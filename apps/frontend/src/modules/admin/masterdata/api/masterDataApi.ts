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
  createdAt: string;
}

export interface Merchant {
  id: string;
  name: string;
  status: "active" | "inactive";
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
  async getBuyers(): Promise<any[]> {
    const res = await axiosInstance.get("/buyers");
    return res.data.data;
  },
  async createBuyer(name: string): Promise<any> {
    const res = await axiosInstance.post("/buyers", { name });
    return res.data.data;
  },
  async updateBuyer(id: string, name: string): Promise<any> {
    const res = await axiosInstance.put(`/buyers/${id}`, { name });
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
};
