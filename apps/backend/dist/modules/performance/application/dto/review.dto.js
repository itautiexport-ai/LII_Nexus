"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitManagerAssessmentSchema = exports.submitSelfAssessmentSchema = exports.initiateReviewSchema = void 0;
const zod_1 = require("zod");
exports.initiateReviewSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
});
exports.submitSelfAssessmentSchema = zod_1.z.object({
    selfSummary: zod_1.z.string().min(1),
});
exports.submitManagerAssessmentSchema = zod_1.z.object({
    managerSummary: zod_1.z.string().min(1),
    managerScore: zod_1.z.number().min(0).max(100),
});
//# sourceMappingURL=review.dto.js.map