import { z } from "zod";

const CATEGORIES = ["sop", "drawing", "work_instruction", "qc_format", "policy", "contract", "buyer_document", "machine_manual", "training_video"] as const;
const LINK_ENTITY_TYPES = ["employee", "machine", "product", "department", "workflow", "crm_lead"] as const;

export const createDocumentSchema = z.object({
  title: z.string().min(1),
  category: z.enum(CATEGORIES),
  folderId: z.string().uuid().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  isConfidential: z.boolean().optional(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  changeNotes: z.string().max(1000).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.enum(CATEGORIES).optional(),
  folderId: z.string().uuid().optional(),
  expiryDate: z.string().optional(),
  isConfidential: z.boolean().optional(),
  departmentId: z.string().uuid().optional(),
});

export const addVersionSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  changeNotes: z.string().max(1000).optional().nullable(),
});

export const reviewVersionSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export const setTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)),
});

export const addLinkSchema = z.object({
  entityType: z.enum(LINK_ENTITY_TYPES),
  entityId: z.string().uuid(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1),
  parentFolderId: z.string().uuid().optional().nullable(),
});

export const createMachineSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
  factoryDepartmentId: z.string().uuid().optional().nullable(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
});

export const updateMachineSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
});
