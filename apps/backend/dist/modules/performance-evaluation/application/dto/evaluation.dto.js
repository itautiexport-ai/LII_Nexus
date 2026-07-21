"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvaluationSchema = void 0;
const zod_1 = require("zod");
exports.createEvaluationSchema = zod_1.z.object({
    employeeId: zod_1.z.string().min(1),
    evaluationPeriod: zod_1.z.string().min(1),
    score: zod_1.z.number().min(0).max(100).optional().default(0),
    comments: zod_1.z.string().optional().default(""),
    qualityOfWork: zod_1.z.number().optional().default(0),
    technicalCompetence: zod_1.z.number().optional().default(0),
    leadership: zod_1.z.number().optional().default(0),
    teamBehaviour: zod_1.z.number().optional().default(0),
    initiative: zod_1.z.number().optional().default(0),
    costSaving: zod_1.z.number().optional().default(0),
    attendancePunctuality: zod_1.z.number().optional().default(0),
    discipline: zod_1.z.number().optional().default(0),
    behaviourAttitude: zod_1.z.number().optional().default(0),
    communication: zod_1.z.number().optional().default(0),
    responsibilityAccountability: zod_1.z.number().optional().default(0),
    workEthics: zod_1.z.number().optional().default(0),
    teamContribution: zod_1.z.number().optional().default(0),
    attendancePercentage: zod_1.z.number().optional().default(0),
});
//# sourceMappingURL=evaluation.dto.js.map