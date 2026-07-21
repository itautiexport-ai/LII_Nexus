export interface CreateOrderInHandDTO {
  orderDate: string;
  customerName: string;
  country?: string | null;
  merchantName: string;
  erpNumber?: string | null;
  exFactoryDate?: string | null;
  marketplace?: 'Etsy' | 'Shopify' | 'Wholesale' | 'Amazon' | 'Website' | null;
  poNumber?: string | null;
  noOfProducts?: number | null;
  totalQty?: number | null;
  orderValue?: number | null;
  currency?: 'USD' | 'GBP' | 'EUR' | 'INR' | null;
  paymentStatus?: 'Paid' | 'Partial' | 'Pending' | null;
  productionStatus?: 'Pending' | 'In Progress' | 'Completed' | null;
  qcStatus?: 'Pending' | 'Passed' | 'Failed' | null;
  packingStatus?: 'Pending' | 'Completed' | null;
  dispatchStatus?: 'Pending' | 'Booked' | 'Dispatched' | null;
  expectedDispatchDate?: string | null;
  expectedDelivery?: string | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent' | null;
  delayDays?: number | null;
  currentStage?: string | null;
  overallProgress?: number | null;
  overallStatus?: 'Under Process' | 'Dispatched';
}

export interface UpdateOrderInHandDTO extends Partial<CreateOrderInHandDTO> {
  overallStatus?: 'Under Process' | 'Dispatched';
}
