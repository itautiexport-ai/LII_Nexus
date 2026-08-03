import { z } from "zod";

const itemSchema = z.object({
  aliasName: z.string().max(200).optional().nullable(),
  productCode: z.string().max(100).optional().nullable(),
  woodType: z.string().max(100).optional().nullable(),
  orderQty: z.number().min(0).default(0),
  okQty: z.number().min(0).default(0),
  reworkQty: z.number().min(0).default(0),
  uom: z.string().max(20).default("Pcs"),
  qtyAsPerUom: z.number().min(0).optional().nullable(),
});

export const createDprEntrySchema = z.object({
  entryDate: z.string(),
  shiftId: z.string().uuid(),
  factoryDepartmentId: z.string().uuid(),
  supervisorId: z.string().uuid(),
  hodId: z.string().uuid(),
  totalTarget: z.number().min(0).default(0),
  uom: z.string().max(20).default("Pcs"),
  totalAchievement: z.number().min(0).optional(),
  totalRework: z.number().min(0).optional(),
  totalOperator: z.number().int().min(0).default(0),
  totalHelper: z.number().int().min(0).default(0),
  totalContractor: z.number().int().min(0).default(0),
  manpowerDepartmentId: z.string().uuid().optional().nullable(),
  items: z.array(itemSchema).default([]),
});

export const updateDprEntrySchema = z.object({
  entryDate: z.string().optional(),
  shiftId: z.string().uuid().optional(),
  factoryDepartmentId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  hodId: z.string().uuid().optional(),
  totalTarget: z.number().min(0).optional(),
  uom: z.string().max(20).optional(),
  totalAchievement: z.number().min(0).optional(),
  totalRework: z.number().min(0).optional(),
  totalOperator: z.number().int().min(0).optional(),
  totalHelper: z.number().int().min(0).optional(),
  totalContractor: z.number().int().min(0).optional(),
  manpowerDepartmentId: z.string().uuid().optional().nullable(),
  items: z.array(itemSchema).optional(),
});
