import { axiosInstance } from "../../../services/api/axiosInstance";

export interface ProductionEmRecord {
  sNo: number;
  departmentName: string;
  hodName: string;
  achievedCbm: number;
  manpower: number;
  salary: number;
}

export const productionEmApi = {
  getReport: async (startDate: string, endDate: string) => {
    const response = await axiosInstance.get("/reports/production-em", {
      params: { startDate, endDate }
    });
    return response.data.data;
  }
};
