import { z } from "zod";

const CATEGORIES = ["office", "factory", "crm", "purchase", "quality", "hr"] as const;
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;

export const createDefinitionSchema = z.object({
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  formula: z.string().min(1).max(255),
  weightage: z.number().min(0).max(100),
  frequency: z.enum(FREQUENCIES),
  responsibleEmployeeId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  greenThreshold: z.number().min(0).optional(),
  amberThreshold: z.number().min(0).optional(),
});

export const updateDefinitionSchema = z.object({
  name: z.string().min(1).optional(),
  formula: z.string().min(1).max(255).optional(),
  weightage: z.number().min(0).max(100).optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  responsibleEmployeeId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  greenThreshold: z.number().min(0).optional(),
  amberThreshold: z.number().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const recordEntrySchema = z.object({
  periodKey: z.string().max(10).optional(),
  target: z.number(),
  actual: z.number(),
});

export const validateFormulaSchema = z.object({
  formula: z.string().min(1).max(255),
});
