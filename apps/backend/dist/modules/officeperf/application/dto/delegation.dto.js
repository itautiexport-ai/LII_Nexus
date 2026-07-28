"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondExtensionSchema = exports.requestExtensionSchema = exports.addFileSchema = exports.escalateSchema = exports.updateStatusSchema = exports.updateDelegatedTaskSchema = exports.createDelegatedTaskSchema = void 0;
const zod_1 = require("zod");
exports.createDelegatedTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().max(1000).optional().nullable(),
    assignedBy: zod_1.z.string().uuid().optional(),
    assignedTo: zod_1.z.string().uuid(),
    dueDate: zod_1.z.string(), // YYYY-MM-DD
    priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
    isAttachmentMandatory: zod_1.z.boolean().optional().default(false),
    isNoteMandatory: zod_1.z.boolean().optional().default(false),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
    sendAppNotification: zod_1.z.boolean().optional().default(true),
    sendWhatsappNotification: zod_1.z.boolean().optional().default(true),
});
exports.updateDelegatedTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().max(1000).optional().nullable(),
    dueDate: zod_1.z.string().optional(),
    priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["running", "completed"]),
});
exports.escalateSchema = zod_1.z.object({
    escalateTo: zod_1.z.string().uuid(),
    notes: zod_1.z.string().max(500).optional().nullable(),
});
exports.addFileSchema = zod_1.z.object({
    kind: zod_1.z.enum(["attachment", "proof"]),
    fileName: zod_1.z.string().min(1),
    fileUrl: zod_1.z.string().min(1),
});
exports.requestExtensionSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1).max(1000),
    requestedDate: zod_1.z.string(), // YYYY-MM-DD
});
exports.respondExtensionSchema = zod_1.z.object({
    status: zod_1.z.enum(["approved", "rejected"]),
    rejectionReason: zod_1.z.string().max(1000).optional().nullable(),
});
//# sourceMappingURL=delegation.dto.js.map