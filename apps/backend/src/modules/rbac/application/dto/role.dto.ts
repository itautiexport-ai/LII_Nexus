import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const setRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
  scopeType: z.string().default("global"),
  scopeId: z.string().default(""),
});
