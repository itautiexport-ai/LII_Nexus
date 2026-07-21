"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFileSchema = exports.completeFollowupSchema = exports.logFollowupSchema = exports.assignLeadSchema = exports.updateLeadSchema = exports.createLeadSchema = void 0;
const zod_1 = require("zod");
exports.createLeadSchema = zod_1.z.object({
    inquiryDate: zod_1.z.string(),
    contactName: zod_1.z.string().min(1),
    contactPersons: zod_1.z.string().max(1000).optional().nullable(),
    companyName: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    multipleAddresses: zod_1.z.string().max(2000).optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable(),
    leadSource: zod_1.z.enum(["trade_fair", "whatsapp", "email", "website", "referral", "other"]),
    leadCategory: zod_1.z.enum(["export", "domestic", "hotel_restaurant_project", "buyer_agent", "repeat_customer"]),
    currency: zod_1.z.string().max(10).optional().nullable(),
    preferredLanguage: zod_1.z.string().max(50).optional().nullable(),
    creditLimit: zod_1.z.number().min(0).optional().nullable(),
    paymentTerms: zod_1.z.string().max(500).optional().nullable(),
    productCategory: zod_1.z.string().optional().nullable(),
    inquiryDetails: zod_1.z.string().max(2000).optional().nullable(),
    assignedMerchantId: zod_1.z.string().uuid().optional().nullable(),
    forecastAmount: zod_1.z.number().min(0).optional().nullable(),
    winProbability: zod_1.z.number().min(0).max(100).optional().nullable(),
    expectedCloseDate: zod_1.z.string().optional().nullable(),
    nextFollowUpDate: zod_1.z.string().optional().nullable(),
    followUpRemarks: zod_1.z.string().max(1000).optional().nullable(),
    nextAction: zod_1.z.string().max(500).optional().nullable(),
    priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
});
exports.updateLeadSchema = zod_1.z.object({
    contactName: zod_1.z.string().min(1).optional(),
    contactPersons: zod_1.z.string().max(1000).optional().nullable(),
    companyName: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    multipleAddresses: zod_1.z.string().max(2000).optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable(),
    leadSource: zod_1.z.enum(["trade_fair", "whatsapp", "email", "website", "referral", "other"]).optional(),
    leadCategory: zod_1.z.enum(["export", "domestic", "hotel_restaurant_project", "buyer_agent", "repeat_customer"]).optional(),
    currency: zod_1.z.string().max(10).optional().nullable(),
    preferredLanguage: zod_1.z.string().max(50).optional().nullable(),
    creditLimit: zod_1.z.number().min(0).optional().nullable(),
    paymentTerms: zod_1.z.string().max(500).optional().nullable(),
    productCategory: zod_1.z.string().optional().nullable(),
    inquiryDetails: zod_1.z.string().max(2000).optional().nullable(),
    salesStage: zod_1.z.enum([
        "new_inquiry", "discovery", "qualification", "product_shared", "quotation_sent", "negotiation",
        "sample_discussion", "sample_under_development", "order_expected", "order_won", "order_lost", "dead_dormant",
    ]).optional(),
    forecastAmount: zod_1.z.number().min(0).optional().nullable(),
    winProbability: zod_1.z.number().min(0).max(100).optional().nullable(),
    expectedCloseDate: zod_1.z.string().optional().nullable(),
    nextFollowUpDate: zod_1.z.string().optional().nullable(),
    followUpRemarks: zod_1.z.string().max(1000).optional().nullable(),
    nextAction: zod_1.z.string().max(500).optional().nullable(),
    status: zod_1.z.enum(["active", "won", "lost", "dead", "dormant"]).optional(),
    priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
});
exports.assignLeadSchema = zod_1.z.object({
    merchantId: zod_1.z.string().uuid().nullable(),
});
exports.logFollowupSchema = zod_1.z.object({
    dueDate: zod_1.z.string(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
    nextAction: zod_1.z.string().max(500).optional().nullable(),
});
exports.completeFollowupSchema = zod_1.z.object({
    remarks: zod_1.z.string().max(1000).optional().nullable(),
});
exports.addFileSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1),
    fileUrl: zod_1.z.string().min(1),
});
//# sourceMappingURL=lead.dto.js.map