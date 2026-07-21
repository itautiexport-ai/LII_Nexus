import { z } from "zod";

export const createQuotationSchema = z.object({
  buyerId: z.string().uuid("Invalid Buyer ID"),
  skuCode: z.string().min(1, "SKU Code is required"),
  productName: z.string().min(1, "Product Name is required"),
  productImageUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "negotiating", "accepted", "rejected"]).optional(),
});

export const createQuotationQuoteSchema = z.object({
  quoteName: z.string().min(1, "Quote Name is required"),
  currency: z.string().min(1, "Currency is required"),
  price: z.number().min(0, "Price must be positive"),
  notes: z.string().optional().nullable(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type CreateQuotationQuoteInput = z.infer<typeof createQuotationQuoteSchema>;
