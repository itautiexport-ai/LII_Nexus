import { z } from "zod";

export const CreateHelpTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  problemSolverId: z.string().uuid("Invalid problem solver"),
  problem: z.string().min(1, "Problem description is required"),
  priority: z.enum(["High", "Medium", "Low"]),
  plannedDate: z.string().nullable().optional(),
  attachmentMandatory: z.boolean().optional().default(false),
  mediaUrl: z.string().nullable().optional(),
});

export const UpdateHelpTicketStatusSchema = z.object({
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]),
});

export const UpdateHelpTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required").optional(),
  problemSolverId: z.string().uuid("Invalid problem solver").optional(),
  problem: z.string().min(1, "Problem description is required").optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  plannedDate: z.string().nullable().optional(),
  attachmentMandatory: z.boolean().optional(),
  mediaUrl: z.string().nullable().optional(),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]).optional(),
});

export type CreateHelpTicketDto = z.infer<typeof CreateHelpTicketSchema>;
export type UpdateHelpTicketStatusDto = z.infer<typeof UpdateHelpTicketStatusSchema>;
export type UpdateHelpTicketDto = z.infer<typeof UpdateHelpTicketSchema>;
