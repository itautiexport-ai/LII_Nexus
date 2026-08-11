import { z } from "zod";

export const CreateStandaloneChecklistSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  assignBy: z.string().uuid("Assign By must be a valid employee UUID"),
  assignTo: z.string().uuid("Assign To must be a valid employee UUID"),
  plannedDate: z.string().datetime("Planned date must be a valid ISO string"),
  priority: z.enum(["Low", "Medium", "High"]),
  makeAttachmentMandatory: z.boolean().default(false),
  makeNoteMandatory: z.boolean().default(false),
  mode: z.string().min(1, "Mode is required"),
  frequency: z.string().min(1, "Frequency is required"),
  whenRule: z.string().optional(),
  remindBeforeDays: z.number().int().min(0).default(0),
  skipOnHolidays: z.boolean().default(false),
});

export type CreateStandaloneChecklistDto = z.infer<typeof CreateStandaloneChecklistSchema>;
