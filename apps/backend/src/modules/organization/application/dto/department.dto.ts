import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
