import { axiosInstance } from "../../../services/api/axiosInstance";

export interface CartonOrder {
  id: string;
  erpOrderNumber: string;
  aliasName?: string;
  createdAt: string;
}

export interface CreateCartonOrderDto {
  erpOrderNumber: string;
  aliasName?: string;
}

export const cartonOrderApi = {
  async create(payload: CreateCartonOrderDto): Promise<CartonOrder> {
    const res = await axiosInstance.post("/carton-orders", payload);
    return res.data.data;
  },

  async getAll(): Promise<CartonOrder[]> {
    const res = await axiosInstance.get("/carton-orders");
    return res.data.data;
  },
};
