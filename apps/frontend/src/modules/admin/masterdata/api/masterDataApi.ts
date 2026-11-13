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

  // Hardware And Accessories
  async getHardwareAccessories(): Promise<HardwareAccessory[]> {
    const res = await axiosInstance.get("/hardware-accessories");
    return res.data.data;
  },
  async createHardwareAccessory(payload: HardwareAccessoryInput): Promise<HardwareAccessory> {
    const res = await axiosInstance.post("/hardware-accessories", payload);
    return res.data.data;
  },
  async updateHardwareAccessory(id: string, payload: HardwareAccessoryInput): Promise<HardwareAccessory> {
    const res = await axiosInstance.put(`/hardware-accessories/${id}`, payload);
    return res.data.data;
  },
  async deleteHardwareAccessory(id: string): Promise<void> {
    await axiosInstance.delete(`/hardware-accessories/${id}`);
  },

  // Wood Thickness Prices
  async getWoodThicknessPrices(): Promise<WoodThicknessPriceRecord[]> {
    const res = await axiosInstance.get("/wood-thickness-prices");
    return res.data.data;
  },
  async createWoodThicknessPrice(payload: WoodThicknessPriceInput): Promise<WoodThicknessPriceRecord> {
    const res = await axiosInstance.post("/wood-thickness-prices", payload);
    return res.data.data;
  },
  async updateWoodThicknessPrice(id: string, payload: WoodThicknessPriceInput): Promise<WoodThicknessPriceRecord> {
    const res = await axiosInstance.put(`/wood-thickness-prices/${id}`, payload);
    return res.data.data;
  },
  async deleteWoodThicknessPrice(id: string): Promise<void> {
    await axiosInstance.delete(`/wood-thickness-prices/${id}`);
  },

  // Wood Part Names
  async getWoodPartNames(): Promise<WoodPartNameRecord[]> {
    const res = await axiosInstance.get("/wood-part-names");
    return res.data.data;
  },
  async createWoodPartName(payload: WoodPartNameInput): Promise<WoodPartNameRecord> {
    const res = await axiosInstance.post("/wood-part-names", payload);
    return res.data.data;
  },
  async updateWoodPartName(id: string, payload: WoodPartNameInput): Promise<WoodPartNameRecord> {
    const res = await axiosInstance.put(`/wood-part-names/${id}`, payload);
    return res.data.data;
  },
  async deleteWoodPartName(id: string): Promise<void> {
    await axiosInstance.delete(`/wood-part-names/${id}`);
  },

  // Additional Costs
  async getAdditionalCosts(): Promise<AdditionalCostRecord[]> {
    const res = await axiosInstance.get("/additional-costs");
    return res.data.data;
  },
  async createAdditionalCost(payload: AdditionalCostInput): Promise<AdditionalCostRecord> {
    const res = await axiosInstance.post("/additional-costs", payload);
    return res.data.data;
  },
  async updateAdditionalCost(id: string, payload: AdditionalCostInput): Promise<AdditionalCostRecord> {
    const res = await axiosInstance.put(`/additional-costs/${id}`, payload);
    return res.data.data;
  },
  async deleteAdditionalCost(id: string): Promise<void> {
    await axiosInstance.delete(`/additional-costs/${id}`);
  },

  // MDF Prices
  async getMdfPrices(): Promise<MdfPriceRecord[]> {
    const res = await axiosInstance.get("/mdf-prices");
    return res.data.data;
  },
  async createMdfPrice(payload: MdfPriceInput): Promise<MdfPriceRecord> {
    const res = await axiosInstance.post("/mdf-prices", payload);
    return res.data.data;
  },
  async updateMdfPrice(id: string, payload: MdfPriceInput): Promise<MdfPriceRecord> {
    const res = await axiosInstance.put(`/mdf-prices/${id}`, payload);
    return res.data.data;
  },
  async deleteMdfPrice(id: string): Promise<void> {
    await axiosInstance.delete(`/mdf-prices/${id}`);
  },
};

export interface QcName {
  id: string;
  name: string;
  createdAt?: string;
}

export interface HardwareAccessory {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  sizeSpec: string;
  materialFinish: string;
  uom: string;
  rate: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface HardwareAccessoryInput {
  id?: string;
  itemCode: string;
  itemName: string;
  category?: string;
  sizeSpec?: string | null;
  materialFinish?: string | null;
  uom?: string;
  rate: number;
  status?: "active" | "inactive";
}

export interface WoodThicknessPriceRecord {
  id: string;
  woodType: string;
  thickness: string;
  thicknessUom: string;
  length: string;
  lengthUom: string;
  ratePerCft: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface WoodThicknessPriceInput {
  id?: string;
  woodType: string;
  thickness: string;
  thicknessUom: string;
  length: string;
  lengthUom: string;
  ratePerCft: number;
  status?: "active" | "inactive";
}

export interface WoodPartNameRecord {
  id: string;
  partCode: string;
  partName: string;
}

export interface WoodPartNameInput {
  id?: string;
  partCode: string;
  partName: string;
}

export interface AdditionalCostRecord {
  id: string;
  itemCode: string;
  itemName: string;
  price: number;
  uom: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdditionalCostInput {
  id?: string;
  itemCode: string;
  itemName: string;
  price: number;
  uom?: string;
  status?: "active" | "inactive";
}

export interface MdfPriceRecord {
  id: string;
  mdfType: string;
  sheetSize: string;
  thickness: string;
  price: number;
  uom: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface MdfPriceInput {
  id?: string;
  mdfType: string;
  sheetSize: string;
  thickness: string;
  price: number;
  uom?: string;
  status?: "active" | "inactive";
}
