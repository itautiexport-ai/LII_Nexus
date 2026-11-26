export interface CreateCostEstimationItemDto {
  category: 'Raw Material' | 'Hardware' | 'Labor' | 'Finishing' | 'Packaging' | 'Overhead' | 'Other';
  item_name: string;
  specification?: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  remarks?: string;
  length_ft?: number;
  width_in?: number;
  thick_in?: number;
  pcs?: number;
}

export interface CalculateWoodCftDto {
  length: number;
  width: number;
  thickness: number;
  pcs: number;
  rate?: number;
}

export interface CreateCostEstimationDto {
  title?: string;
  product_code?: string;
  product_name?: string;
  product_type?: string;
  collection_name?: string;
  type_of_costing?: string;
  overall_size?: string;
  wood_type?: string;
  client_name?: string;
  crm_lead_id?: string;
  currency?: string;
  exchange_rate?: number;
  margin_percentage?: number;
  tax_percentage?: number;
  notes?: string;
  form_data?: string;
  costing_request_item_id?: string;
  items: CreateCostEstimationItemDto[];
}

export interface UpdateCostEstimationDto {
  title?: string;
  product_code?: string;
  product_name?: string;
  product_type?: string;
  collection_name?: string;
  type_of_costing?: string;
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
  form_data?: string;
  costing_request_item_id?: string;
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

export interface CreateCostingRequestItemInputDto {
  product_name: string;
  product_code?: string;
  buyer_code?: string;
  costing_code?: string;
  product_type?: string;
  collection_name?: string;
  sample_availability?: 'Not Available' | 'Sample Available';
  wood_type?: string;
  overall_size?: string;
  client_name?: string;
  description?: string;
  image_url?: string;
  image_urls?: string[];
  priority?: 'Normal' | 'High' | 'Urgent';
}

export interface CreateCostingRequestBunchDto {
  merchant_name: string;
  client_name?: string;
  notes?: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  items: CreateCostingRequestItemInputDto[];
}
