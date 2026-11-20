export interface CostEstimationItem {
  id?: string;
  estimation_id?: string;
  category: 'Raw Material' | 'Hardware' | 'Labor' | 'Finishing' | 'Packaging' | 'Overhead' | 'Other';
  item_name: string;
  specification?: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  total_cost: number;
  remarks?: string;
  created_at?: Date;
}

export interface CostEstimation {
  id: string;
  estimation_number: string;
  title: string;
  product_code?: string;
  product_name?: string;
  product_type?: string;
  collection_name?: string;
  type_of_costing?: string;
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
  form_data?: string | null;
  costing_request_item_id?: string;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
  items?: CostEstimationItem[];
}

export interface CostingRequestItem {
  id: string;
  bunch_id: string;
  bunch_code: string;
  product_code: string;
  product_name: string;
  product_type?: string;
  collection_name?: string;
  wood_type?: string;
  overall_size?: string;
  client_name?: string;
  description?: string;
  image_url?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  stage: 'Pending' | 'In Progress' | 'In Review' | 'Approved' | 'Rejected';
  estimation_id?: string;
  estimation_number?: string;
  final_price?: number;
  merchant_name: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CostingRequestBunch {
  id: string;
  bunch_code: string;
  merchant_id?: string;
  merchant_name: string;
  client_name?: string;
  notes?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  total_products: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: Date;
  updated_at: Date;
  items?: CostingRequestItem[];
}

export interface CostRateMaster {
  id: string;
  item_name: string;
  category: string;
  unit_of_measure: string;
  rate: number;
  effective_date?: string;
  created_at?: Date;
  updated_at?: Date;
}
