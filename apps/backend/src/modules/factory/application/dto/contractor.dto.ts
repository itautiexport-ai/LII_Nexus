import { z } from "zod";

export const createContractorSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export const updateContractorSchema = z.object({
  name: z.string().min(1).optional(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});
