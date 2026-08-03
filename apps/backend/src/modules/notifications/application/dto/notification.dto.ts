import { z } from "zod";

export const updateTemplateSchema = z.object({
  defaultTitle: z.string().min(1).optional(),
  defaultDescription: z.string().max(1000).optional().nullable(),
  defaultPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  defaultActionLabel: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateEscalationRuleSchema = z.object({
  targetRoleId: z.string().uuid().optional().nullable(),
  escalateAfterHours: z.number().int().min(1).optional(),
});
