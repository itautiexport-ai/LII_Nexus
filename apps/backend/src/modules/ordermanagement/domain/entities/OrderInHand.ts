export interface OrderInHand {
  id: string;
  orderId: string;
  orderDate: string; // YYYY-MM-DD
  customerName: string;
  country: string | null;
  merchantName: string;
  erpNumber: string | null;
  exFactoryDate: string | null;
  marketplace: 'Etsy' | 'Shopify' | 'Wholesale' | 'Amazon' | 'Website' | null;
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
  expectedDispatchDate: string | null; // YYYY-MM-DD
  expectedDelivery: string | null; // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | null;
  delayDays: number | null;
  currentStage: string | null;
  overallProgress: number | null;
  overallStatus: 'Under Process' | 'Dispatched';
  totalCbm: number | null;
  createdAt: Date;
  updatedAt: Date;
}
