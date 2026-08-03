import { z } from "zod";

export const createProductionEntrySchema = z.object({
  employeeId: z.string().uuid(),
  lineId: z.string().uuid(),
  shiftId: z.string().uuid(),
  entryDate: z.string(), // "YYYY-MM-DD"
  quantityProduced: z.number().min(0),
  targetQuantity: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateProductionEntrySchema = z.object({
  quantityProduced: z.number().min(0).optional(),
  targetQuantity: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});
