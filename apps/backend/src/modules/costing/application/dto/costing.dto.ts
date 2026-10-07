export interface CreateCostEstimationItemDto {
  category: 'Raw Material' | 'Hardware' | 'Labor' | 'Finishing' | 'Packaging' | 'Overhead' | 'Other';
  item_name: string;
  specification?: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  remarks?: string;
}

export interface CreateCostEstimationDto {
  title?: string;
  product_code?: string;
  product_name?: string;
  overall_size?: string;
  wood_type?: string;
  client_name?: string;
  crm_lead_id?: string;
  currency?: string;
  exchange_rate?: number;
  margin_percentage?: number;
  tax_percentage?: number;
  notes?: string;
  items: CreateCostEstimationItemDto[];
}

export interface UpdateCostEstimationDto {
  title?: string;
  product_code?: string;
  product_name?: string;
  overall_size?: string;
  wood_type?: string;
  client_name?: string;
  crm_lead_id?: string;
  status?: 'Draft' | 'In Review' | 'Approved' | 'Rejected';
  currency?: string;
  exchange_rate?: number;
  margin_percentage?: number;
  tax_percentage?: number;
  notes?: string;
  items?: CreateCostEstimationItemDto[];
}

export interface SaveCostRateDto {
  id?: string;
  item_name: string;
  category: string;
  unit_of_measure: string;
  rate: number;
  effective_date?: string;
}
