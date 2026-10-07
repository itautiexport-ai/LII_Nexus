import { axiosInstance } from "../../../services/api/axiosInstance";

export interface CostEstimationItem {
  id?: string;
  category: 'Raw Material' | 'Hardware' | 'Labor' | 'Finishing' | 'Packaging' | 'Overhead' | 'Other';
  item_name: string;
  specification?: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  total_cost?: number;
  remarks?: string;
}

export interface CostEstimation {
  id: string;
  estimation_number: string;
  title: string;
  product_code?: string;
  product_name?: string;
  overall_size?: string;
  wood_type?: string;
  client_name?: string;
  crm_lead_id?: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Rejected';
  currency: string;
  exchange_rate: number;
  total_material_cost: number;
  total_labor_cost: number;
  total_overhead_cost: number;
  total_finishing_cost: number;
  total_packaging_cost: number;
  subtotal_cost: number;
  margin_percentage: number;
  margin_amount: number;
  tax_percentage: number;
  tax_amount: number;
  final_price: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  items?: CostEstimationItem[];
}

export interface CostRateMaster {
  id?: string;
  item_name: string;
  category: string;
  unit_of_measure: string;
  rate: number;
  effective_date?: string;
  created_at?: string;
}

export const costingApi = {
  getSummary: async () => {
    const res = await axiosInstance.get("/costing/summary");
    return res.data.data;
  },

  getAllEstimations: async (search?: string, status?: string) => {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const res = await axiosInstance.get("/costing/estimations", { params });
    return res.data.data as CostEstimation[];
  },

  getEstimationById: async (id: string) => {
    const res = await axiosInstance.get(`/costing/estimations/${id}`);
    return res.data.data as CostEstimation;
  },

  createEstimation: async (data: Partial<CostEstimation>) => {
    const res = await axiosInstance.post("/costing/estimations", data);
    return res.data.data as CostEstimation;
  },

  updateEstimation: async (id: string, data: Partial<CostEstimation>) => {
    const res = await axiosInstance.put(`/costing/estimations/${id}`, data);
    return res.data.data as CostEstimation;
  },

  deleteEstimation: async (id: string) => {
    const res = await axiosInstance.delete(`/costing/estimations/${id}`);
    return res.data.data;
  },

  getAllRates: async () => {
    const res = await axiosInstance.get("/costing/rates");
    return res.data.data as CostRateMaster[];
  },

  saveRate: async (data: Partial<CostRateMaster>) => {
    const res = await axiosInstance.post("/costing/rates", data);
    return res.data.data as CostRateMaster;
  },

  deleteRate: async (id: string) => {
    const res = await axiosInstance.delete(`/costing/rates/${id}`);
    return res.data.data;
  },
};
