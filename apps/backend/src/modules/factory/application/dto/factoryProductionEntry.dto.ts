import { z } from "zod";

export const createEntrySchema = z.object({
  entryDate: z.string(),
  shiftId: z.string().uuid(),
  factoryDepartmentId: z.string().uuid(),
  orderReference: z.string().optional().nullable(),
  productionMethod: z.enum(["finished_sku", "component_level"]),
  skuCode: z.string().optional().nullable(),
  componentName: z.string().optional().nullable(),
  targetQty: z.number().min(0).optional().nullable(),
  actualQty: z.number().min(0).optional().nullable(),
  targetCbm: z.number().min(0).optional().nullable(),
  actualCbm: z.number().min(0).optional().nullable(),
  targetLabourHours: z.number().min(0).optional().nullable(),
  actualLabourHours: z.number().min(0).optional().nullable(),
  delayMinutes: z.number().int().min(0).optional(),
  delayReason: z.string().max(500).optional().nullable(),
  rejectionQty: z.number().min(0).optional(),
  reworkQty: z.number().min(0).optional(),
  supervisorId: z.string().uuid(),
  contractorId: z.string().uuid().optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
})
  .refine((e) => e.productionMethod !== "finished_sku" || (!!e.skuCode && !e.componentName), {
    message: "Method 1 (Finished SKU) entries must provide an SKU code and must not provide a component name.",
    path: ["skuCode"],
  })
  .refine((e) => e.productionMethod !== "component_level" || (!!e.componentName && !e.skuCode), {
    message: "Method 2 (Component Level) entries must provide a component name and must not provide an SKU code.",
    path: ["componentName"],
  });

export const updateEntrySchema = z.object({
  orderReference: z.string().optional().nullable(),
  targetQty: z.number().min(0).optional().nullable(),
  actualQty: z.number().min(0).optional().nullable(),
  targetCbm: z.number().min(0).optional().nullable(),
  actualCbm: z.number().min(0).optional().nullable(),
  targetLabourHours: z.number().min(0).optional().nullable(),
  actualLabourHours: z.number().min(0).optional().nullable(),
  delayMinutes: z.number().int().min(0).optional(),
  delayReason: z.string().max(500).optional().nullable(),
  rejectionQty: z.number().min(0).optional(),
  reworkQty: z.number().min(0).optional(),
  contractorId: z.string().uuid().optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});

export const rejectEntrySchema = z.object({
  reason: z.string().min(1),
});

export const addFileSchema = z.object({
  kind: z.enum(["photo", "attachment"]),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
});
