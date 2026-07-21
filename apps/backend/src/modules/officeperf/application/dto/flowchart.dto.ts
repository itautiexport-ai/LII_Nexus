import { z } from "zod";

export const createRunSchema = z.object({
  workflowId: z.string().uuid(),
  reference: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
});

export const assignTaskSchema = z.object({
  employeeId: z.string().uuid(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["running", "completed"]),
  remarks: z.string().max(1000).optional().nullable(),
});
