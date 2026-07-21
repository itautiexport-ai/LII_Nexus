import { z } from "zod";

const checklistItemSchema = z.object({ label: z.string().min(1) });

const stageDocumentSchema = z.object({
  documentName: z.string().min(1),
  isMandatory: z.boolean().optional(),
});

const notificationRuleSchema = z.object({
  triggerEvent: z.enum(["on_stage_start", "on_due_date", "on_overdue", "on_completion", "on_escalation"]),
  channel: z.enum(["email", "sms", "in_app"]).optional(),
  recipientType: z.enum(["responsible_role", "initiator", "custom_role"]).optional(),
  customRoleId: z.string().uuid().optional().nullable(),
  messageTemplate: z.string().max(500).optional().nullable(),
});

const escalationRuleSchema = z.object({
  escalateAfterDays: z.number().int().min(1),
  escalateToRoleId: z.string().uuid(),
  escalationAction: z.enum(["notify_only", "reassign"]).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const stageSchema = z.object({
  name: z.string().min(1),
  responsibleRoleId: z.string().uuid(),
  dueDays: z.number().int().min(0).optional().nullable(),
  approvalRequired: z.boolean().optional(),
  checklistRequired: z.boolean().optional(),
  canSkip: z.boolean().optional(),
  completionMode: z.enum(["manual", "approval_only", "all_checklist_items", "all_of_the_above"]).optional(),
  minMandatoryDocuments: z.number().int().min(0).optional(),
  checklistItems: z.array(checklistItemSchema).optional(),
  mandatoryDocuments: z.array(stageDocumentSchema).optional(),
  notificationRules: z.array(notificationRuleSchema).optional(),
  escalationRules: z.array(escalationRuleSchema).optional(),
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

export const createWorkflowSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().uuid().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  stages: z.array(stageSchema).optional(),
});

export const updateWorkflowMetaSchema = z.object({
  name: z.string().min(1).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["draft", "active", "inactive", "archived"]),
});

export const reorderStagesSchema = z.object({
  stageIds: z.array(z.string().uuid()).min(1),
});
