import { z } from "zod";

export const createDelegatedTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).optional().nullable(),
  assignedBy: z.string().uuid().optional(),
  assignedTo: z.string().uuid(),
  dueDate: z.string(), // YYYY-MM-DD
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  isAttachmentMandatory: z.boolean().optional().default(false),
  isNoteMandatory: z.boolean().optional().default(false),
  remarks: z.string().max(1000).optional().nullable(),
  sendAppNotification: z.boolean().optional().default(true),
  sendWhatsappNotification: z.boolean().optional().default(true),
});

export const updateDelegatedTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  remarks: z.string().max(1000).optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["running", "completed"]),
});

export const escalateSchema = z.object({
  escalateTo: z.string().uuid(),
  notes: z.string().max(500).optional().nullable(),
});

export const addFileSchema = z.object({
  kind: z.enum(["attachment", "proof"]),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
});

export const requestExtensionSchema = z.object({
  reason: z.string().min(1).max(1000),
  requestedDate: z.string(), // YYYY-MM-DD
});

export const respondExtensionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(1000).optional().nullable(),
  updatedDate: z.string().optional().nullable(),
});
