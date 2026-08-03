import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  shiftId: z.string().uuid().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(), // ISO date string, e.g. "2026-07-04"
  birthday: z.string().optional().nullable(),
  anniversary: z.string().optional().nullable(),
  salary: z.number().nonnegative().optional(),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  shiftId: z.string().uuid().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  anniversary: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  salary: z.number().nonnegative().optional(),
});
