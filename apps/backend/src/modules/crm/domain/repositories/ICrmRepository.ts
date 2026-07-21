import { Lead, LeadCategory, LeadFile, LeadFollowup, LeadPriority, LeadSource, LeadStatus, LeadWithContext, SalesStage } from "../entities/Lead";

export interface CreateLeadData {
  id: string;
  leadCode: string;
  inquiryDate: string;
  contactName: string;
  contactPersons?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
  multipleAddresses?: string | null;
  phone?: string | null;
  email?: string | null;
  leadSource: LeadSource;
  leadCategory: LeadCategory;
  currency?: string | null;
  preferredLanguage?: string | null;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  productCategory?: string | null;
  inquiryDetails?: string | null;
  assignedMerchantId?: string | null;
  forecastAmount?: number | null;
  winProbability?: number | null;
  expectedCloseDate?: string | null;
  nextFollowUpDate?: string | null;
  followUpRemarks?: string | null;
  nextAction?: string | null;
  priority?: LeadPriority;
  createdBy: string | null;
}

export interface UpdateLeadData {
  contactName?: string;
  contactPersons?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
  multipleAddresses?: string | null;
  phone?: string | null;
  email?: string | null;
  leadSource?: LeadSource;
  leadCategory?: LeadCategory;
  currency?: string | null;
  preferredLanguage?: string | null;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  productCategory?: string | null;
  inquiryDetails?: string | null;
  salesStage?: SalesStage;
  forecastAmount?: number | null;
  winProbability?: number | null;
  weightedForecast?: number | null;
  expectedCloseDate?: string | null;
  nextFollowUpDate?: string | null;
  followUpRemarks?: string | null;
  nextAction?: string | null;
  status?: LeadStatus;
  priority?: LeadPriority;
  updatedBy?: string;
}

export interface ListLeadsParams {
  page: number;
  pageSize: number;
  search?: string;
  assignedMerchantId?: string;
  status?: LeadStatus;
  salesStage?: SalesStage;
  leadSource?: LeadSource;
  leadCategory?: LeadCategory;
  priority?: LeadPriority;
  overdueOnly?: boolean;
}

export interface ICrmRepository {
  list(params: ListLeadsParams): Promise<{ items: LeadWithContext[]; total: number }>;
  findById(id: string): Promise<Lead | null>;
  getWithContext(id: string): Promise<LeadWithContext | null>;
  findByLeadCode(leadCode: string): Promise<Lead | null>;
  nextLeadCodeSequence(): Promise<number>;
  create(data: CreateLeadData): Promise<Lead>;
  update(id: string, changes: UpdateLeadData): Promise<Lead>;
  assign(id: string, merchantId: string | null, updatedBy: string | null): Promise<Lead>;
  softDelete(id: string): Promise<void>;

  logFollowup(data: { id: string; leadId: string; dueDate: string; remarks?: string | null; nextAction?: string | null; loggedBy: string | null }): Promise<LeadFollowup>;
  completeFollowup(id: string, remarks: string | null, loggedBy: string | null): Promise<LeadFollowup>;
  getPendingFollowup(leadId: string): Promise<LeadFollowup | null>;
  listFollowupsForLead(leadId: string): Promise<LeadFollowup[]>;

  addFile(leadId: string, fileName: string, fileUrl: string, uploadedBy: string | null): Promise<LeadFile>;
  listFilesForLead(leadId: string): Promise<LeadFile[]>;

  // Quotations
  listQuotations(): Promise<any[]>;
  createQuotation(data: any): Promise<any>;
  updateQuotationStatus(id: string, status: string): Promise<void>;
  addQuotationQuote(data: any): Promise<any>;
  listQuotationQuotes(quotationId: string): Promise<any[]>;
}
