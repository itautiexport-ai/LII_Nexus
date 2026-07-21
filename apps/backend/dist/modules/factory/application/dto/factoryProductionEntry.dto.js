"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFileSchema = exports.rejectEntrySchema = exports.updateEntrySchema = exports.createEntrySchema = void 0;
const zod_1 = require("zod");
exports.createEntrySchema = zod_1.z.object({
    entryDate: zod_1.z.string(),
    shiftId: zod_1.z.string().uuid(),
    factoryDepartmentId: zod_1.z.string().uuid(),
    orderReference: zod_1.z.string().optional().nullable(),
    productionMethod: zod_1.z.enum(["finished_sku", "component_level"]),
    skuCode: zod_1.z.string().optional().nullable(),
    componentName: zod_1.z.string().optional().nullable(),
    targetQty: zod_1.z.number().min(0).optional().nullable(),
    actualQty: zod_1.z.number().min(0).optional().nullable(),
    targetCbm: zod_1.z.number().min(0).optional().nullable(),
    actualCbm: zod_1.z.number().min(0).optional().nullable(),
    targetLabourHours: zod_1.z.number().min(0).optional().nullable(),
    actualLabourHours: zod_1.z.number().min(0).optional().nullable(),
    delayMinutes: zod_1.z.number().int().min(0).optional(),
    delayReason: zod_1.z.string().max(500).optional().nullable(),
    rejectionQty: zod_1.z.number().min(0).optional(),
    reworkQty: zod_1.z.number().min(0).optional(),
    supervisorId: zod_1.z.string().uuid(),
    contractorId: zod_1.z.string().uuid().optional().nullable(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
})
    .refine((e) => e.productionMethod !== "finished_sku" || (!!e.skuCode && !e.componentName), {
    message: "Method 1 (Finished SKU) entries must provide an SKU code and must not provide a component name.",
    path: ["skuCode"],
})
    .refine((e) => e.productionMethod !== "component_level" || (!!e.componentName && !e.skuCode), {
    message: "Method 2 (Component Level) entries must provide a component name and must not provide an SKU code.",
    path: ["componentName"],
});
exports.updateEntrySchema = zod_1.z.object({
    orderReference: zod_1.z.string().optional().nullable(),
    targetQty: zod_1.z.number().min(0).optional().nullable(),
    actualQty: zod_1.z.number().min(0).optional().nullable(),
    targetCbm: zod_1.z.number().min(0).optional().nullable(),
    actualCbm: zod_1.z.number().min(0).optional().nullable(),
    targetLabourHours: zod_1.z.number().min(0).optional().nullable(),
    actualLabourHours: zod_1.z.number().min(0).optional().nullable(),
    delayMinutes: zod_1.z.number().int().min(0).optional(),
    delayReason: zod_1.z.string().max(500).optional().nullable(),
    rejectionQty: zod_1.z.number().min(0).optional(),
    reworkQty: zod_1.z.number().min(0).optional(),
    contractorId: zod_1.z.string().uuid().optional().nullable(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
});
exports.rejectEntrySchema = zod_1.z.object({
    reason: zod_1.z.string().min(1),
});
exports.addFileSchema = zod_1.z.object({
    kind: zod_1.z.enum(["photo", "attachment"]),
    fileName: zod_1.z.string().min(1),
    fileUrl: zod_1.z.string().min(1),
});
//# sourceMappingURL=factoryProductionEntry.dto.js.map