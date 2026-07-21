"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logProgressSchema = exports.updateGoalSchema = exports.createGoalSchema = void 0;
const zod_1 = require("zod");
exports.createGoalSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().optional().nullable(),
    targetValue: zod_1.z.number().optional().nullable(),
    weight: zod_1.z.number().min(0).max(100).default(0),
    startDate: zod_1.z.string().optional().nullable(),
    targetDate: zod_1.z.string().optional().nullable(),
});
exports.updateGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().optional().nullable(),
    targetValue: zod_1.z.number().optional().nullable(),
    weight: zod_1.z.number().min(0).max(100).optional(),
    status: zod_1.z.enum(["active", "completed", "cancelled"]).optional(),
    startDate: zod_1.z.string().optional().nullable(),
    targetDate: zod_1.z.string().optional().nullable(),
});
exports.logProgressSchema = zod_1.z.object({
    value: zod_1.z.number(),
    note: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=goal.dto.js.map