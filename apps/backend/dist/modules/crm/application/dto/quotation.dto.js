"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuotationQuoteSchema = exports.createQuotationSchema = void 0;
const zod_1 = require("zod");
exports.createQuotationSchema = zod_1.z.object({
    buyerId: zod_1.z.string().uuid("Invalid Buyer ID"),
    skuCode: zod_1.z.string().min(1, "SKU Code is required"),
    productName: zod_1.z.string().min(1, "Product Name is required"),
    productImageUrl: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["draft", "negotiating", "accepted", "rejected"]).optional(),
});
exports.createQuotationQuoteSchema = zod_1.z.object({
    quoteName: zod_1.z.string().min(1, "Quote Name is required"),
    currency: zod_1.z.string().min(1, "Currency is required"),
    price: zod_1.z.number().min(0, "Price must be positive"),
    notes: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=quotation.dto.js.map