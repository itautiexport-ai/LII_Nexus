"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEscalationRuleSchema = exports.updateTemplateSchema = void 0;
const zod_1 = require("zod");
exports.updateTemplateSchema = zod_1.z.object({
    defaultTitle: zod_1.z.string().min(1).optional(),
    defaultDescription: zod_1.z.string().max(1000).optional().nullable(),
    defaultPriority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
    defaultActionLabel: zod_1.z.string().max(100).optional().nullable(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
exports.updateEscalationRuleSchema = zod_1.z.object({
    targetRoleId: zod_1.z.string().uuid().optional().nullable(),
    escalateAfterHours: zod_1.z.number().int().min(1).optional(),
});
//# sourceMappingURL=notification.dto.js.map