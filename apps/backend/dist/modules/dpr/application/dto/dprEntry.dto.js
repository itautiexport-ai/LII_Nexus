"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDprEntrySchema = exports.createDprEntrySchema = void 0;
const zod_1 = require("zod");
const itemSchema = zod_1.z.object({
    aliasName: zod_1.z.string().max(200).optional().nullable(),
    productCode: zod_1.z.string().max(100).optional().nullable(),
    woodType: zod_1.z.string().max(100).optional().nullable(),
    orderQty: zod_1.z.number().min(0).default(0),
    okQty: zod_1.z.number().min(0).default(0),
    reworkQty: zod_1.z.number().min(0).default(0),
    uom: zod_1.z.string().max(20).default("Pcs"),
    qtyAsPerUom: zod_1.z.number().min(0).optional().nullable(),
});
exports.createDprEntrySchema = zod_1.z.object({
    entryDate: zod_1.z.string(),
    shiftId: zod_1.z.string().uuid(),
    factoryDepartmentId: zod_1.z.string().uuid(),
    supervisorId: zod_1.z.string().uuid(),
    hodId: zod_1.z.string().uuid(),
    totalTarget: zod_1.z.number().min(0).default(0),
    uom: zod_1.z.string().max(20).default("Pcs"),
    totalAchievement: zod_1.z.number().min(0).optional(),
    totalRework: zod_1.z.number().min(0).optional(),
    totalOperator: zod_1.z.number().int().min(0).default(0),
    totalHelper: zod_1.z.number().int().min(0).default(0),
    totalContractor: zod_1.z.number().int().min(0).default(0),
    manpowerDepartmentId: zod_1.z.string().uuid().optional().nullable(),
    items: zod_1.z.array(itemSchema).default([]),
});
exports.updateDprEntrySchema = zod_1.z.object({
    entryDate: zod_1.z.string().optional(),
    shiftId: zod_1.z.string().uuid().optional(),
    factoryDepartmentId: zod_1.z.string().uuid().optional(),
    supervisorId: zod_1.z.string().uuid().optional(),
    hodId: zod_1.z.string().uuid().optional(),
    totalTarget: zod_1.z.number().min(0).optional(),
    uom: zod_1.z.string().max(20).optional(),
    totalAchievement: zod_1.z.number().min(0).optional(),
    totalRework: zod_1.z.number().min(0).optional(),
    totalOperator: zod_1.z.number().int().min(0).optional(),
    totalHelper: zod_1.z.number().int().min(0).optional(),
    totalContractor: zod_1.z.number().int().min(0).optional(),
    manpowerDepartmentId: zod_1.z.string().uuid().optional().nullable(),
    items: zod_1.z.array(itemSchema).optional(),
});
//# sourceMappingURL=dprEntry.dto.js.map