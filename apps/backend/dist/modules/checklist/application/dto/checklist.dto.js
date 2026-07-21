"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateStandaloneChecklistSchema = void 0;
const zod_1 = require("zod");
exports.CreateStandaloneChecklistSchema = zod_1.z.object({
    taskName: zod_1.z.string().min(1, "Task name is required"),
    assignBy: zod_1.z.string().uuid("Assign By must be a valid employee UUID"),
    assignTo: zod_1.z.string().uuid("Assign To must be a valid employee UUID"),
    plannedDate: zod_1.z.string().datetime("Planned date must be a valid ISO string"),
    priority: zod_1.z.enum(["Low", "Medium", "High"]),
    makeAttachmentMandatory: zod_1.z.boolean().default(false),
    makeNoteMandatory: zod_1.z.boolean().default(false),
    mode: zod_1.z.string().min(1, "Mode is required"),
    frequency: zod_1.z.string().min(1, "Frequency is required"),
    remindBeforeDays: zod_1.z.number().int().min(0).default(0),
    skipOnHolidays: zod_1.z.boolean().default(false),
});
//# sourceMappingURL=checklist.dto.js.map