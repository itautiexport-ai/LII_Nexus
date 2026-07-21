"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatusSchema = exports.assignTaskSchema = exports.createRunSchema = void 0;
const zod_1 = require("zod");
exports.createRunSchema = zod_1.z.object({
    workflowId: zod_1.z.string().uuid(),
    reference: zod_1.z.string().min(1),
    notes: zod_1.z.string().max(1000).optional().nullable(),
});
exports.assignTaskSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["running", "completed"]),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
});
//# sourceMappingURL=flowchart.dto.js.map