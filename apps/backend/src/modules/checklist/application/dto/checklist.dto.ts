import { z } from "zod";

export const CreateStandaloneChecklistSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  assignBy: z.string().uuid("Assign By must be a valid employee UUID"),
  assignTo: z.string().uuid("Assign To must be a valid employee UUID"),
  makeAttachmentMandatory: z.boolean().default(false),
  makeNoteMandatory: z.boolean().default(false),
  mode: z.string().min(1, "Mode is required"),
  frequency: z.string().min(1, "Frequency is required"),
  remindBeforeDays: z.string().default(""),
  reminderDays: z.number().optional(),
  skipOnHolidays: z.boolean().default(false),
});

export const BulkDeleteStandaloneChecklistSchema = z.object({
  ids: z.array(z.string().uuid("Invalid ID format")).min(1, "At least one ID is required")
});

export type CreateStandaloneChecklistDto = z.infer<typeof CreateStandaloneChecklistSchema>;
