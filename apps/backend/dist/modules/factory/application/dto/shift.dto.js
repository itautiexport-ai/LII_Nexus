"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShiftSchema = exports.createShiftSchema = void 0;
const zod_1 = require("zod");
exports.createShiftSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    startTime: zod_1.z.string().optional().nullable(), // "HH:MM" or "HH:MM:SS"
    endTime: zod_1.z.string().optional().nullable(),
});
exports.updateShiftSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    startTime: zod_1.z.string().optional().nullable(),
    endTime: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=shift.dto.js.map