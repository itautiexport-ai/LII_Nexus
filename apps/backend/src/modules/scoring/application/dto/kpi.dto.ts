import { z } from "zod";

export const createKpiSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["office", "factory", "crm"]),
  calculationType: z.enum([
    "flowchart", "checklist", "delegation", "target_achievement", "quality", "timeliness", "manual",
    "crm_followup_discipline", "crm_conversion", "crm_pipeline_value", "crm_delay_control", "crm_data_discipline",
  ]),
  defaultWeightage: z.number().min(0).max(100),
  description: z.string().max(500).optional().nullable(),
});

export const updateKpiSchema = z.object({
  name: z.string().min(1).optional(),
  defaultWeightage: z.number().min(0).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const setDepartmentWeightageSchema = z.object({
  departmentId: z.string().uuid(),
  weightage: z.number().min(0).max(100),
});

export const recordManualScoreSchema = z.object({
  employeeId: z.string().uuid(),
  kpiDefinitionId: z.string().uuid(),
  periodType: z.enum(["monthly", "yearly"]),
  periodKey: z.string().min(4).max(10),
  score: z.number().min(0).max(100),
});
