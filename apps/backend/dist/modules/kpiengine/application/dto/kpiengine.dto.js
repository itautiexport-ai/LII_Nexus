"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFormulaSchema = exports.recordEntrySchema = exports.updateDefinitionSchema = exports.createDefinitionSchema = void 0;
const zod_1 = require("zod");
const CATEGORIES = ["office", "factory", "crm", "purchase", "quality", "hr"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "yearly"];
exports.createDefinitionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    category: zod_1.z.enum(CATEGORIES),
    formula: zod_1.z.string().min(1).max(255),
    weightage: zod_1.z.number().min(0).max(100),
    frequency: zod_1.z.enum(FREQUENCIES),
    responsibleEmployeeId: zod_1.z.string().uuid().optional().nullable(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    greenThreshold: zod_1.z.number().min(0).optional(),
    amberThreshold: zod_1.z.number().min(0).optional(),
});
exports.updateDefinitionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    formula: zod_1.z.string().min(1).max(255).optional(),
    weightage: zod_1.z.number().min(0).max(100).optional(),
    frequency: zod_1.z.enum(FREQUENCIES).optional(),
    responsibleEmployeeId: zod_1.z.string().uuid().optional().nullable(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    greenThreshold: zod_1.z.number().min(0).optional(),
    amberThreshold: zod_1.z.number().min(0).optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
exports.recordEntrySchema = zod_1.z.object({
    periodKey: zod_1.z.string().max(10).optional(),
    target: zod_1.z.number(),
    actual: zod_1.z.number(),
});
exports.validateFormulaSchema = zod_1.z.object({
    formula: zod_1.z.string().min(1).max(255),
});
//# sourceMappingURL=kpiengine.dto.js.map