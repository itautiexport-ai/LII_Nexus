import { z } from "zod";

export const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().optional().nullable(), // "HH:MM" or "HH:MM:SS"
  endTime: z.string().optional().nullable(),
});

export const updateShiftSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
});
