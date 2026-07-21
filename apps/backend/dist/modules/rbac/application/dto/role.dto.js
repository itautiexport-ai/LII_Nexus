"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRoleSchema = exports.setRolePermissionsSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().nullable(),
});
exports.updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
});
exports.setRolePermissionsSchema = zod_1.z.object({
    permissionIds: zod_1.z.array(zod_1.z.string().uuid()),
});
exports.assignRoleSchema = zod_1.z.object({
    roleId: zod_1.z.string().uuid(),
    scopeType: zod_1.z.string().default("global"),
    scopeId: zod_1.z.string().default(""),
});
//# sourceMappingURL=role.dto.js.map