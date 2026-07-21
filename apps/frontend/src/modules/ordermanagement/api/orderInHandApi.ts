import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface OrderInHandRecord {
  id: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  country?: string | null;
  merchantName: string;
  erpNumber?: string | null;
  exFactoryDate?: string | null;
  marketplace?: 'Etsy' | 'Shopify' | 'Wholesale' | 'Amazon' | 'Website' | null;
  poNumber: string | null;
  noOfProducts: number | null;
  totalQty: number | null;
  orderValue: number | null;
  currency: 'USD' | 'GBP' | 'EUR' | 'INR' | null;
  paymentStatus: 'Paid' | 'Partial' | 'Pending' | null;
  productionStatus: 'Pending' | 'In Progress' | 'Completed' | null;
  qcStatus: 'Pending' | 'Passed' | 'Failed' | null;
  packingStatus: 'Pending' | 'Completed' | null;
  dispatchStatus: 'Pending' | 'Booked' | 'Dispatched' | null;
  expectedDispatchDate: string | null;
  expectedDelivery: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | null;
  delayDays: number | null;
  currentStage: string | null;
  overallProgress: number | null;
  overallStatus: 'Under Process' | 'Dispatched';
  createdAt: string;
  updatedAt: string;
}

class OrderInHandApi {
  async getAll(): Promise<OrderInHandRecord[]> {
    const { data } = await api.get("/orders-in-hand");
    return data;
  }

  async getById(id: string): Promise<OrderInHandRecord> {
    const { data } = await api.get(`/orders-in-hand/${id}`);
    return data;
  }

  async create(payload: Partial<OrderInHandRecord>): Promise<OrderInHandRecord> {
    const { data } = await api.post("/orders-in-hand", payload);
    return data;
  }

  async update(id: string, payload: Partial<OrderInHandRecord>): Promise<OrderInHandRecord> {
    const { data } = await api.put(`/orders-in-hand/${id}`, payload);
    return data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/orders-in-hand/${id}`);
  }
}

export const orderInHandApi = new OrderInHandApi();
