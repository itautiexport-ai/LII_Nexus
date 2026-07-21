import { z } from "zod";

export const createDesignationSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const updateDesignationSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});
