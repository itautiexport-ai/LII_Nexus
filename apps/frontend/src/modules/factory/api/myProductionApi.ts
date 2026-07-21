import { axiosInstance } from "../../../services/api/axiosInstance";
import { ProductionEntryRecord } from "./factoryApi";

export const myProductionApi = {
  async list(employeeId: string): Promise<ProductionEntryRecord[]> {
    const res = await axiosInstance.get(`/employees/${employeeId}/production-entries`);
    return res.data.data;
  },
};
