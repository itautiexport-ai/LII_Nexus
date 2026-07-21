import { axiosInstance } from "../../../services/api/axiosInstance";

export type LeadSource = "trade_fair" | "whatsapp" | "email" | "website" | "referral" | "other";
export type LeadCategory = "export" | "domestic" | "hotel_restaurant_project" | "buyer_agent" | "repeat_customer";
export type SalesStage =
  | "new_inquiry" | "discovery" | "qualification" | "product_shared" | "quotation_sent" | "negotiation"
  | "sample_discussion" | "sample_under_development" | "order_expected" | "order_won" | "order_lost" | "dead_dormant";
export type LeadStatus = "active" | "won" | "lost" | "dead" | "dormant";
export type LeadPriority = "low" | "medium" | "high" | "urgent";

export interface LeadRecord {
  id: string;
  leadCode: string;
  inquiryDate: string;
  contactName: string;
  contactPersons: string | null;
  companyName: string | null;
  country: string | null;
  city: string | null;
  multipleAddresses: string | null;
  phone: string | null;
  email: string | null;
  leadSource: LeadSource;
  leadCategory: LeadCategory;
  currency: string | null;
  preferredLanguage: string | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  productCategory: string | null;
  inquiryDetails: string | null;
  assignedMerchantId: string | null;
  merchantName: string | null;
  salesStage: SalesStage;
  forecastAmount: number | null;
  winProbability: number | null;
  weightedForecast: number | null;
  expectedCloseDate: string | null;
  nextFollowUpDate: string | null;
  followUpRemarks: string | null;
  nextAction: string | null;
  delayDays: number;
  status: LeadStatus;
  priority: LeadPriority;
  createdByName: string | null;
  updatedByName: string | null;
}

export interface FollowupRecord {
  id: string;
  dueDate: string;
  completedAt: string | null;
  onTime: boolean | null;
  remarks: string | null;
  nextAction: string | null;
}

export interface LeadDetail extends LeadRecord {
  followups: FollowupRecord[];
  files: { id: string; fileName: string; fileUrl: string }[];
}

export const crmApi = {
  async list(params: Record<string, string | boolean | undefined> = {}) {
    const res = await axiosInstance.get("/crm/leads", { params: { page: 1, pageSize: 20, ...params } });
    return { items: res.data.data as LeadRecord[], totalItems: res.data.meta.totalItems as number };
  },
  async getById(id: string): Promise<LeadDetail> {
    const res = await axiosInstance.get(`/crm/leads/${id}`);
    return res.data.data;
  },
  async create(payload: Record<string, unknown>) {
    const res = await axiosInstance.post("/crm/leads", payload);
    return res.data.data as LeadRecord;
  },
  async update(id: string, payload: Record<string, unknown>) {
    const res = await axiosInstance.patch(`/crm/leads/${id}`, payload);
    return res.data.data as LeadRecord;
  },
  async assign(id: string, merchantId: string | null) {
    const res = await axiosInstance.patch(`/crm/leads/${id}/assign`, { merchantId });
    return res.data.data as LeadRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/crm/leads/${id}`);
  },
  async logFollowup(id: string, dueDate: string, remarks?: string, nextAction?: string) {
    const res = await axiosInstance.post(`/crm/leads/${id}/followups`, { dueDate, remarks, nextAction });
    return res.data.data;
  },
  async addFile(id: string, fileName: string, fileUrl: string) {
    const res = await axiosInstance.post(`/crm/leads/${id}/files`, { fileName, fileUrl });
    return res.data.data;
  },
  async exportExcel() {
    const res = await axiosInstance.get("/crm/leads/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-leads-export.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  },
  async importExcel(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post("/crm/leads/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.data as { imported: number };
  },

  async myMerchantMetrics() {
    const res = await axiosInstance.get("/crm/merchant-metrics/me");
    return res.data.data;
  },
  async ceoDashboard() { return (await axiosInstance.get("/crm/dashboards/ceo")).data.data; },
  async merchantDashboard() { return (await axiosInstance.get("/crm/dashboards/merchants")).data.data; },
  async leadSourceDashboard() { return (await axiosInstance.get("/crm/dashboards/lead-source")).data.data; },
  async exportVsDomesticDashboard() { return (await axiosInstance.get("/crm/dashboards/export-vs-domestic")).data.data; },
  async followUpDelayDashboard() { return (await axiosInstance.get("/crm/dashboards/follow-up-delay")).data.data; },
  async forecastPipelineDashboard() { return (await axiosInstance.get("/crm/dashboards/forecast-pipeline")).data.data; },
  async wonLostDashboard() { return (await axiosInstance.get("/crm/dashboards/won-lost")).data.data; },

  // Quotations
  async listQuotations() {
    const res = await axiosInstance.get("/crm/quotations");
    return res.data.data;
  },
  async createQuotation(payload: any) {
    const res = await axiosInstance.post("/crm/quotations", payload);
    return res.data.data;
  },
  async updateQuotationStatus(id: string, status: string) {
    const res = await axiosInstance.patch(`/crm/quotations/${id}/status`, { status });
    return res.data.data;
  },
  async listQuotes(quotationId: string) {
    const res = await axiosInstance.get(`/crm/quotations/${quotationId}/quotes`);
    return res.data.data;
  },
  async addQuote(quotationId: string, payload: any) {
    const res = await axiosInstance.post(`/crm/quotations/${quotationId}/quotes`, payload);
    return res.data.data;
  }
};
