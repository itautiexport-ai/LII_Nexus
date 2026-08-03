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

export type CreateHelpTicketDto = z.infer<typeof CreateHelpTicketSchema>;
export type UpdateHelpTicketStatusDto = z.infer<typeof UpdateHelpTicketStatusSchema>;
