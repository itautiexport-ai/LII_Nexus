export type LeadSource = "trade_fair" | "whatsapp" | "email" | "website" | "referral" | "other";
export type LeadCategory = "export" | "domestic" | "hotel_restaurant_project" | "buyer_agent" | "repeat_customer";
export type SalesStage =
  | "new_inquiry" | "discovery" | "qualification" | "product_shared" | "quotation_sent" | "negotiation"
  | "sample_discussion" | "sample_under_development" | "order_expected" | "order_won" | "order_lost" | "dead_dormant";
export type LeadStatus = "active" | "won" | "lost" | "dead" | "dormant";
export type LeadPriority = "low" | "medium" | "high" | "urgent";

export interface Lead {
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
  salesStage: SalesStage;
  forecastAmount: number | null;
  winProbability: number | null;
  weightedForecast: number | null;
  expectedCloseDate: string | null;
  nextFollowUpDate: string | null;
  followUpRemarks: string | null;
  nextAction: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface LeadWithContext extends Lead {
  merchantName: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  delayDays: number;
}

/** Delay days is derived, never stored: today minus the pending follow-up
 *  date, for an active lead only (won/lost/dead/dormant leads don't accrue
 *  "delay" - there's nothing pending to be late on). */
export function computeDelayDays(lead: Pick<Lead, "status" | "nextFollowUpDate">): number {
  if (lead.status !== "active" || !lead.nextFollowUpDate) return 0;
  const due = new Date(lead.nextFollowUpDate);
  const today = new Date(new Date().toDateString());
  const diffMs = today.getTime() - due.getTime();
  return diffMs > 0 ? Math.round(diffMs / 86400000) : 0;
}

/** Always computed, never hand-entered - same "no manual calculation"
 *  convention as the Scoring Engine. */
export function computeWeightedForecast(forecastAmount: number | null, winProbability: number | null): number | null {
  if (forecastAmount === null || winProbability === null) return null;
  return Math.round(forecastAmount * (winProbability / 100) * 100) / 100;
}

export interface LeadFollowup {
  id: string;
  leadId: string;
  dueDate: string;
  completedAt: Date | null;
  onTime: boolean | null;
  remarks: string | null;
  nextAction: string | null;
  loggedBy: string | null;
  createdAt: Date;
}

export interface LeadFile {
  id: string;
  leadId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string | null;
  uploadedAt: Date;
}
