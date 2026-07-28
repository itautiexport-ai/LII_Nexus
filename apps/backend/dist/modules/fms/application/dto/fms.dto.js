"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFmsStepSchema = exports.CreateFmsManagerSchema = void 0;
const zod_1 = require("zod");
exports.CreateFmsManagerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    sopVideoLink: zod_1.z.string().url("Must be a valid URL").optional().or(zod_1.z.literal("")),
    description: zod_1.z.string().min(1, "Description is required"),
    formFields: zod_1.z.array(zod_1.z.any()).optional(),
});
exports.CreateFmsStepSchema = zod_1.z.object({
    stepName: zod_1.z.string().min(1, "Step name is required"),
    doerEmployeeIds: zod_1.z.array(zod_1.z.string().uuid("Must be a valid UUID")),
    timelineHours: zod_1.z.number().min(0, "Timeline cannot be negative").default(0),
    timelineUnit: zod_1.z.enum(["hours", "days"]).default("hours"),
    isSequential: zod_1.z.boolean().default(true),
    sequenceOrder: zod_1.z.number().int().min(0).default(0),
});
//# sourceMappingURL=fms.dto.js.map