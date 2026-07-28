import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().min(1, "User ID / Login ID is required."), // Login ID
  password: z.string().min(4, "Password must be at least 4 characters."),
  fullName: z.string().min(1, "Name is required."),
  whatsappNumber: z.string().optional().nullable(),
  employeeCode: z.string().optional().nullable(),
  designationId: z.string().uuid().or(z.literal("")).optional().nullable(),
  departmentId: z.string().uuid().or(z.literal("")).optional().nullable(),
  shiftId: z.string().uuid().or(z.literal("")).optional().nullable(),
  roles: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().min(1, "User ID / Login ID is required.").optional(),
  password: z.string().min(4, "Password must be at least 4 characters.").optional(),
  fullName: z.string().min(1).optional(),
  whatsappNumber: z.string().optional().nullable(),
  employeeCode: z.string().optional().nullable(),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  departmentId: z.string().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
