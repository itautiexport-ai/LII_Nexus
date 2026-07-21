import { axiosInstance } from "../../../services/api/axiosInstance";

export interface ProductionPlanningData {
  factoryName: string;
  factoryList: string;
  orderDate: string;
  company?: string;
  erpNo?: string;
  exFactoryDate: string;
  totalCbm: number;
  sezCbm?: number;
  sirsiCbm?: number;
  vendorCbm?: number;
  vendorName?: string;
  machineShopCbm?: number;
  assemblyCbm?: number;
  sandingCbm?: number;
  finishingCbm?: number;
  packingCbm?: number;
}

export interface ProductionPlanningRecord extends ProductionPlanningData {
  id: string;
  createdAt?: string;
  attachmentUrl?: string;
}

export const manufacturingApi = {
  createProductionPlan: async (data: FormData) => {
    const response = await axiosInstance.post("/manufacturing/production-planning", data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  async getProductionPlans(): Promise<ProductionPlanningRecord[]> {
    const response = await axiosInstance.get('/manufacturing/production-planning');
    return response.data as ProductionPlanningRecord[];
  },

  async deleteProductionPlan(id: string) {
    const response = await axiosInstance.delete(`/manufacturing/production-planning/${id}`);
    return response.data;
  },

  async updateCbmSplit(id: string, sezCbm: number, sirsiCbm: number, vendorCbm: number, vendorName?: string) {
    const response = await axiosInstance.patch(`/manufacturing/production-planning/${id}/cbm-split`, { sezCbm, sirsiCbm, vendorCbm, vendorName });
    return response.data;
  },

  async updateProcessCbm(id: string, machineShopCbm: number, assemblyCbm: number, sandingCbm: number, finishingCbm: number, packingCbm: number) {
    const response = await axiosInstance.patch(`/manufacturing/production-planning/${id}/process-cbm`, { machineShopCbm, assemblyCbm, sandingCbm, finishingCbm, packingCbm });
    return response.data;
  }
};
