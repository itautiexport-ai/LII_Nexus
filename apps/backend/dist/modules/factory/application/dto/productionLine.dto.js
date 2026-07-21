"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductionLineSchema = exports.createProductionLineSchema = void 0;
const zod_1 = require("zod");
exports.createProductionLineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
});
exports.updateProductionLineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    code: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=productionLine.dto.js.map