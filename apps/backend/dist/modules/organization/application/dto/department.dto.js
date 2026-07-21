"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
});
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    code: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=department.dto.js.map