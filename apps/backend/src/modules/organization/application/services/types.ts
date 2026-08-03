import { z } from "zod";
import { createEmployeeSchema, updateEmployeeSchema } from "../dto/employee.dto";

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
