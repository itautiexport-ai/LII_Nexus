import { z } from "zod";

export const updateComponentSchema = z.object({
  weight: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const submitFeedbackSchema = z.object({
  employeeId: z.string().uuid(),
  periodType: z.enum(["monthly", "yearly"]),
  periodKey: z.string().min(4).max(10),
  rating: z.number().int().min(1).max(5),
  comments: z.string().max(1000).optional(),
});

export const updateInsightRuleSchema = z.object({
  thresholdValue: z.number().min(0).optional(),
  enabled: z.boolean().optional(),
});
