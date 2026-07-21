"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInsightRuleSchema = exports.submitFeedbackSchema = exports.updateComponentSchema = void 0;
const zod_1 = require("zod");
exports.updateComponentSchema = zod_1.z.object({
    weight: zod_1.z.number().min(0).max(100).optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
exports.submitFeedbackSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    periodType: zod_1.z.enum(["monthly", "yearly"]),
    periodKey: zod_1.z.string().min(4).max(10),
    rating: zod_1.z.number().int().min(1).max(5),
    comments: zod_1.z.string().max(1000).optional(),
});
exports.updateInsightRuleSchema = zod_1.z.object({
    thresholdValue: zod_1.z.number().min(0).optional(),
    enabled: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=behaviour.dto.js.map