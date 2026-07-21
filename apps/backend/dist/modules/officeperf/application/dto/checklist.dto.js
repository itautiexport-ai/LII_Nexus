"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setItemCheckedSchema = exports.updateTemplateSchema = exports.createTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().max(1000).optional().nullable(),
    frequency: zod_1.z.enum(["daily", "weekly", "monthly"]),
    items: zod_1.z.array(zod_1.z.object({ label: zod_1.z.string().min(1) })).min(1, "At least one checklist item is required."),
    assignments: zod_1.z.array(zod_1.z.object({ employeeId: zod_1.z.string().uuid().optional().nullable(), roleId: zod_1.z.string().uuid().optional().nullable() })
        .refine((a) => (!!a.employeeId) !== (!!a.roleId), { message: "Each assignment must target exactly one employee OR one role." })).optional(),
});
exports.updateTemplateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().max(1000).optional().nullable(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
    items: zod_1.z.array(zod_1.z.object({ label: zod_1.z.string().min(1) })).min(1).optional(),
    assignments: zod_1.z.array(zod_1.z.object({ employeeId: zod_1.z.string().uuid().optional().nullable(), roleId: zod_1.z.string().uuid().optional().nullable() })
        .refine((a) => (!!a.employeeId) !== (!!a.roleId), { message: "Each assignment must target exactly one employee OR one role." })).optional(),
});
exports.setItemCheckedSchema = zod_1.z.object({
    checked: zod_1.z.boolean(),
});
//# sourceMappingURL=checklist.dto.js.map