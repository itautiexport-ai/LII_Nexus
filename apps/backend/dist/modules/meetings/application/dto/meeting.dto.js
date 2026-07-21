"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAttachmentSchema = exports.createActionSchema = exports.addDecisionSchema = exports.setReviewSectionSchema = exports.updateMeetingSchema = exports.createMeetingSchema = void 0;
const zod_1 = require("zod");
const MEETING_TYPES = ["daily_production", "weekly_executive", "monthly_management_review", "quarterly_review"];
const REVIEW_TYPES = ["department", "performance", "factory", "crm", "sales", "production", "quality", "purchase", "hr"];
exports.createMeetingSchema = zod_1.z.object({
    meetingType: zod_1.z.enum(MEETING_TYPES),
    title: zod_1.z.string().min(1),
    meetingDate: zod_1.z.string(),
    attendeeIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    agendaItems: zod_1.z.array(zod_1.z.string().min(1)).optional(),
});
exports.updateMeetingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    meetingDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(["scheduled", "completed", "cancelled"]).optional(),
    discussionNotes: zod_1.z.string().max(5000).optional().nullable(),
});
exports.setReviewSectionSchema = zod_1.z.object({
    reviewType: zod_1.z.enum(REVIEW_TYPES),
    notes: zod_1.z.string().max(2000).optional().nullable(),
});
exports.addDecisionSchema = zod_1.z.object({
    decisionText: zod_1.z.string().min(1).max(1000),
});
exports.createActionSchema = zod_1.z.object({
    description: zod_1.z.string().min(1).max(500),
    assignedTo: zod_1.z.string().uuid(),
    targetDate: zod_1.z.string(),
    priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
});
exports.addAttachmentSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1),
    fileUrl: zod_1.z.string().min(1),
});
//# sourceMappingURL=meeting.dto.js.map