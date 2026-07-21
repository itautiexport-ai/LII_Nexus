"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
exports.createEmployeeSchema = zod_1.z.object({
    employeeCode: zod_1.z.string().min(1),
    fullName: zod_1.z.string().min(1),
    email: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    designationId: zod_1.z.string().uuid().optional().nullable(),
    managerId: zod_1.z.string().uuid().optional().nullable(),
    shiftId: zod_1.z.string().uuid().optional().nullable(),
    dateOfJoining: zod_1.z.string().optional().nullable(), // ISO date string, e.g. "2026-07-04"
    birthday: zod_1.z.string().optional().nullable(),
    anniversary: zod_1.z.string().optional().nullable(),
});
exports.updateEmployeeSchema = zod_1.z.object({
    employeeCode: zod_1.z.string().min(1).optional(),
    fullName: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    designationId: zod_1.z.string().uuid().optional().nullable(),
    managerId: zod_1.z.string().uuid().optional().nullable(),
    userId: zod_1.z.string().uuid().optional().nullable(),
    shiftId: zod_1.z.string().uuid().optional().nullable(),
    dateOfJoining: zod_1.z.string().optional().nullable(),
    birthday: zod_1.z.string().optional().nullable(),
    anniversary: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
//# sourceMappingURL=employee.dto.js.map