"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordManualScoreSchema = exports.setDepartmentWeightageSchema = exports.updateKpiSchema = exports.createKpiSchema = void 0;
const zod_1 = require("zod");
exports.createKpiSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    category: zod_1.z.enum(["office", "factory", "crm"]),
    calculationType: zod_1.z.enum([
        "flowchart", "checklist", "delegation", "target_achievement", "quality", "timeliness", "manual",
        "crm_followup_discipline", "crm_conversion", "crm_pipeline_value", "crm_delay_control", "crm_data_discipline",
    ]),
    defaultWeightage: zod_1.z.number().min(0).max(100),
    description: zod_1.z.string().max(500).optional().nullable(),
});
exports.updateKpiSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    defaultWeightage: zod_1.z.number().min(0).max(100).optional(),
    description: zod_1.z.string().max(500).optional().nullable(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
exports.setDepartmentWeightageSchema = zod_1.z.object({
    departmentId: zod_1.z.string().uuid(),
    weightage: zod_1.z.number().min(0).max(100),
});
exports.recordManualScoreSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    kpiDefinitionId: zod_1.z.string().uuid(),
    periodType: zod_1.z.enum(["monthly", "yearly"]),
    periodKey: zod_1.z.string().min(4).max(10),
    score: zod_1.z.number().min(0).max(100),
});
//# sourceMappingURL=kpi.dto.js.map