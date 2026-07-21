"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContractorSchema = exports.createContractorSchema = void 0;
const zod_1 = require("zod");
exports.createContractorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    contactPerson: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable(),
});
exports.updateContractorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    contactPerson: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
//# sourceMappingURL=contractor.dto.js.map