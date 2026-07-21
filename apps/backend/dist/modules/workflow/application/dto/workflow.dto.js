"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderStagesSchema = exports.updateStatusSchema = exports.updateWorkflowMetaSchema = exports.createWorkflowSchema = exports.stageSchema = void 0;
const zod_1 = require("zod");
const checklistItemSchema = zod_1.z.object({ label: zod_1.z.string().min(1) });
const stageDocumentSchema = zod_1.z.object({
    documentName: zod_1.z.string().min(1),
    isMandatory: zod_1.z.boolean().optional(),
});
const notificationRuleSchema = zod_1.z.object({
    triggerEvent: zod_1.z.enum(["on_stage_start", "on_due_date", "on_overdue", "on_completion", "on_escalation"]),
    channel: zod_1.z.enum(["email", "sms", "in_app"]).optional(),
    recipientType: zod_1.z.enum(["responsible_role", "initiator", "custom_role"]).optional(),
    customRoleId: zod_1.z.string().uuid().optional().nullable(),
    messageTemplate: zod_1.z.string().max(500).optional().nullable(),
});
const escalationRuleSchema = zod_1.z.object({
    escalateAfterDays: zod_1.z.number().int().min(1),
    escalateToRoleId: zod_1.z.string().uuid(),
    escalationAction: zod_1.z.enum(["notify_only", "reassign"]).optional(),
    notes: zod_1.z.string().max(500).optional().nullable(),
});
exports.stageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    responsibleRoleId: zod_1.z.string().uuid(),
    dueDays: zod_1.z.number().int().min(0).optional().nullable(),
    approvalRequired: zod_1.z.boolean().optional(),
    checklistRequired: zod_1.z.boolean().optional(),
    canSkip: zod_1.z.boolean().optional(),
    completionMode: zod_1.z.enum(["manual", "approval_only", "all_checklist_items", "all_of_the_above"]).optional(),
    minMandatoryDocuments: zod_1.z.number().int().min(0).optional(),
    checklistItems: zod_1.z.array(checklistItemSchema).optional(),
    mandatoryDocuments: zod_1.z.array(stageDocumentSchema).optional(),
    notificationRules: zod_1.z.array(notificationRuleSchema).optional(),
    escalationRules: zod_1.z.array(escalationRuleSchema).optional(),
})
    // Backend validation, not just UI convenience: a "checklist required" stage
    // with zero checklist items, or "all_checklist_items" completion with no
    // items to complete, would be a silently-broken configuration once this
    // engine is connected to a real process.
    .refine((s) => !s.checklistRequired || (s.checklistItems?.length ?? 0) > 0, {
    message: "Checklist is required for this stage, so at least one checklist item must be provided.",
    path: ["checklistItems"],
})
    .refine((s) => s.completionMode !== "all_checklist_items" || (s.checklistItems?.length ?? 0) > 0, {
    message: "Completion mode 'all_checklist_items' requires at least one checklist item.",
    path: ["checklistItems"],
})
    .refine((s) => (s.minMandatoryDocuments ?? 0) <= (s.mandatoryDocuments?.length ?? 0), {
    message: "Minimum mandatory documents cannot exceed the number of documents listed for this stage.",
    path: ["minMandatoryDocuments"],
});
exports.createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    description: zod_1.z.string().max(1000).optional().nullable(),
    stages: zod_1.z.array(exports.stageSchema).optional(),
});
exports.updateWorkflowMetaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    description: zod_1.z.string().max(1000).optional().nullable(),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["draft", "active", "inactive", "archived"]),
});
exports.reorderStagesSchema = zod_1.z.object({
    stageIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
//# sourceMappingURL=workflow.dto.js.map