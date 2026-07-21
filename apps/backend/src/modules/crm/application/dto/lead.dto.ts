import { z } from "zod";

export const createLeadSchema = z.object({
  inquiryDate: z.string(),
  contactName: z.string().min(1),
  contactPersons: z.string().max(1000).optional().nullable(),
  companyName: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  multipleAddresses: z.string().max(2000).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  leadSource: z.enum(["trade_fair", "whatsapp", "email", "website", "referral", "other"]),
  leadCategory: z.enum(["export", "domestic", "hotel_restaurant_project", "buyer_agent", "repeat_customer"]),
  currency: z.string().max(10).optional().nullable(),
  preferredLanguage: z.string().max(50).optional().nullable(),
  creditLimit: z.number().min(0).optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  productCategory: z.string().optional().nullable(),
  inquiryDetails: z.string().max(2000).optional().nullable(),
  assignedMerchantId: z.string().uuid().optional().nullable(),
  forecastAmount: z.number().min(0).optional().nullable(),
  winProbability: z.number().min(0).max(100).optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  followUpRemarks: z.string().max(1000).optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const updateLeadSchema = z.object({
  contactName: z.string().min(1).optional(),
  contactPersons: z.string().max(1000).optional().nullable(),
  companyName: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  multipleAddresses: z.string().max(2000).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  leadSource: z.enum(["trade_fair", "whatsapp", "email", "website", "referral", "other"]).optional(),
  leadCategory: z.enum(["export", "domestic", "hotel_restaurant_project", "buyer_agent", "repeat_customer"]).optional(),
  currency: z.string().max(10).optional().nullable(),
  preferredLanguage: z.string().max(50).optional().nullable(),
  creditLimit: z.number().min(0).optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  productCategory: z.string().optional().nullable(),
  inquiryDetails: z.string().max(2000).optional().nullable(),
  salesStage: z.enum([
    "new_inquiry", "discovery", "qualification", "product_shared", "quotation_sent", "negotiation",
    "sample_discussion", "sample_under_development", "order_expected", "order_won", "order_lost", "dead_dormant",
  ]).optional(),
  forecastAmount: z.number().min(0).optional().nullable(),
  winProbability: z.number().min(0).max(100).optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  followUpRemarks: z.string().max(1000).optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "won", "lost", "dead", "dormant"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const assignLeadSchema = z.object({
  merchantId: z.string().uuid().nullable(),
});

export const logFollowupSchema = z.object({
  dueDate: z.string(),
  remarks: z.string().max(1000).optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
});

export const completeFollowupSchema = z.object({
  remarks: z.string().max(1000).optional().nullable(),
});

export const addFileSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
});
