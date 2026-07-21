"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHelpTicketStatusSchema = exports.CreateHelpTicketSchema = void 0;
const zod_1 = require("zod");
exports.CreateHelpTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1, "Subject is required"),
    problemSolverId: zod_1.z.string().uuid("Invalid problem solver"),
    problem: zod_1.z.string().min(1, "Problem description is required"),
    priority: zod_1.z.enum(["High", "Medium", "Low"]),
    plannedDate: zod_1.z.string().nullable().optional(),
    attachmentMandatory: zod_1.z.boolean().optional().default(false),
    mediaUrl: zod_1.z.string().nullable().optional(),
});
exports.UpdateHelpTicketStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["Open", "In Progress", "Resolved", "Closed"]),
});
//# sourceMappingURL=helpTicket.dto.js.map