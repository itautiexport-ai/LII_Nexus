"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductionEntrySchema = exports.createProductionEntrySchema = void 0;
const zod_1 = require("zod");
exports.createProductionEntrySchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    lineId: zod_1.z.string().uuid(),
    shiftId: zod_1.z.string().uuid(),
    entryDate: zod_1.z.string(), // "YYYY-MM-DD"
    quantityProduced: zod_1.z.number().min(0),
    targetQuantity: zod_1.z.number().min(0).optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
exports.updateProductionEntrySchema = zod_1.z.object({
    quantityProduced: zod_1.z.number().min(0).optional(),
    targetQuantity: zod_1.z.number().min(0).optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=productionEntry.dto.js.map