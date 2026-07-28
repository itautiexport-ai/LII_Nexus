"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().min(1, "User ID / Login ID is required."), // Login ID
    password: zod_1.z.string().min(4, "Password must be at least 4 characters."),
    fullName: zod_1.z.string().min(1, "Name is required."),
    whatsappNumber: zod_1.z.string().optional().nullable(),
    employeeCode: zod_1.z.string().optional().nullable(),
    designationId: zod_1.z.string().uuid().or(zod_1.z.literal("")).optional().nullable(),
    departmentId: zod_1.z.string().uuid().or(zod_1.z.literal("")).optional().nullable(),
    shiftId: zod_1.z.string().uuid().or(zod_1.z.literal("")).optional().nullable(),
    roles: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().min(1, "User ID / Login ID is required.").optional(),
    password: zod_1.z.string().min(4, "Password must be at least 4 characters.").optional(),
    fullName: zod_1.z.string().min(1).optional(),
    whatsappNumber: zod_1.z.string().optional().nullable(),
    employeeCode: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["active", "suspended", "inactive"]).optional(),
    departmentId: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=user.dto.js.map