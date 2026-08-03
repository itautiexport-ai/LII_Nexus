import { z } from "zod";

export const createMachineTargetSchema = z.object({
  machineId: z.string().uuid("Invalid machine ID"),
  size: z.string().min(1, "Size is required"),
  target: z.number().min(0, "Target must be positive"),
  uom: z.string().min(1, "UOM is required"),
});

export const updateMachineTargetSchema = z.object({
  target: z.number().min(0, "Target must be positive"),
  uom: z.string().min(1, "UOM is required"),
});

export const createMachineEfficiencyEntrySchema = z.object({
  departmentId: z.string().uuid("Invalid department ID"),
  machineId: z.string().uuid("Invalid machine ID"),
  size: z.string().min(1, "Size is required"),
  target: z.number().min(0, "Target must be positive"),
  achieved: z.number().min(0, "Achieved must be positive"),
  manpowerCount: z.number().int().min(1, "Manpower count must be at least 1"),
});

export type CreateMachineTargetDto = z.infer<typeof createMachineTargetSchema>;
export type UpdateMachineTargetDto = z.infer<typeof updateMachineTargetSchema>;
export type CreateMachineEfficiencyEntryDto = z.infer<typeof createMachineEfficiencyEntrySchema>;
