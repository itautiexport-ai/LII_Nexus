"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDesignationSchema = exports.createDesignationSchema = void 0;
const zod_1 = require("zod");
exports.createDesignationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().nullable(),
});
exports.updateDesignationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=designation.dto.js.map