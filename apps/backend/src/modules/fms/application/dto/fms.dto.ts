import { z } from "zod";

export const CreateFmsManagerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sopVideoLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  formFields: z.array(z.any()).optional(),
});

export type CreateFmsManagerDto = z.infer<typeof CreateFmsManagerSchema>;

export const CreateFmsStepSchema = z.object({
  stepName: z.string().min(1, "Step name is required"),
  doerEmployeeIds: z.array(z.string().uuid("Must be a valid UUID")),
  timelineHours: z.number().min(0, "Timeline cannot be negative").default(0),
  timelineUnit: z.enum(["hours", "days"]).default("hours"),
  isSequential: z.boolean().default(true),
  sequenceOrder: z.number().int().min(0).default(0),
});

export type CreateFmsStepDto = z.infer<typeof CreateFmsStepSchema>;
