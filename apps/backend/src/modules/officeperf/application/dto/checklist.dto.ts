import { z } from "zod";

export const createTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).optional().nullable(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  items: z.array(z.object({ label: z.string().min(1) })).min(1, "At least one checklist item is required."),
  assignments: z.array(
    z.object({ employeeId: z.string().uuid().optional().nullable(), roleId: z.string().uuid().optional().nullable() })
      .refine((a) => (!!a.employeeId) !== (!!a.roleId), { message: "Each assignment must target exactly one employee OR one role." })
  ).optional(),
});

export const updateTemplateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  items: z.array(z.object({ label: z.string().min(1) })).min(1).optional(),
  assignments: z.array(
    z.object({ employeeId: z.string().uuid().optional().nullable(), roleId: z.string().uuid().optional().nullable() })
      .refine((a) => (!!a.employeeId) !== (!!a.roleId), { message: "Each assignment must target exactly one employee OR one role." })
  ).optional(),
});

export const setItemCheckedSchema = z.object({
  checked: z.boolean(),
});
