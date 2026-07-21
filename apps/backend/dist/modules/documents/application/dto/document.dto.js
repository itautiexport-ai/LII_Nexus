"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.updateMachineSchema = exports.createProductSchema = exports.createMachineSchema = exports.createFolderSchema = exports.addLinkSchema = exports.setTagsSchema = exports.reviewVersionSchema = exports.addVersionSchema = exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
const CATEGORIES = ["sop", "drawing", "work_instruction", "qc_format", "policy", "contract", "buyer_document", "machine_manual", "training_video"];
const LINK_ENTITY_TYPES = ["employee", "machine", "product", "department", "workflow", "crm_lead"];
exports.createDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    category: zod_1.z.enum(CATEGORIES),
    folderId: zod_1.z.string().uuid().optional().nullable(),
    expiryDate: zod_1.z.string().optional().nullable(),
    isConfidential: zod_1.z.boolean().optional(),
    fileName: zod_1.z.string().min(1),
    fileUrl: zod_1.z.string().min(1),
    changeNotes: zod_1.z.string().max(1000).optional().nullable(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    category: zod_1.z.enum(CATEGORIES).optional(),
    folderId: zod_1.z.string().uuid().optional(),
    expiryDate: zod_1.z.string().optional(),
    isConfidential: zod_1.z.boolean().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
});
exports.addVersionSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1),
    fileUrl: zod_1.z.string().min(1),
    changeNotes: zod_1.z.string().max(1000).optional().nullable(),
});
exports.reviewVersionSchema = zod_1.z.object({
    approve: zod_1.z.boolean(),
    rejectionReason: zod_1.z.string().max(500).optional().nullable(),
});
exports.setTagsSchema = zod_1.z.object({
    tags: zod_1.z.array(zod_1.z.string().min(1).max(50)),
});
exports.addLinkSchema = zod_1.z.object({
    entityType: zod_1.z.enum(LINK_ENTITY_TYPES),
    entityId: zod_1.z.string().uuid(),
});
exports.createFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    parentFolderId: zod_1.z.string().uuid().optional().nullable(),
});
exports.createMachineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().optional().nullable(),
    factoryDepartmentId: zod_1.z.string().uuid().optional().nullable(),
});
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    sku: zod_1.z.string().optional().nullable(),
});
exports.updateMachineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().optional().nullable(),
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    sku: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=document.dto.js.map