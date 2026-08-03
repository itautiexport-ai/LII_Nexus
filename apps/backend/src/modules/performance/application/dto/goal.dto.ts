import { z } from "zod";

export const createGoalSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  weight: z.number().min(0).max(100).default(0),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  weight: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const logProgressSchema = z.object({
  value: z.number(),
  note: z.string().optional().nullable(),
});
