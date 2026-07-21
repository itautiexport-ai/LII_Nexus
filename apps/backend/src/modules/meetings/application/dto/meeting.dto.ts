import { z } from "zod";

const MEETING_TYPES = ["daily_production", "weekly_executive", "monthly_management_review", "quarterly_review"] as const;
const REVIEW_TYPES = ["department", "performance", "factory", "crm", "sales", "production", "quality", "purchase", "hr"] as const;

export const createMeetingSchema = z.object({
  meetingType: z.enum(MEETING_TYPES),
  title: z.string().min(1),
  meetingDate: z.string(),
  attendeeIds: z.array(z.string().uuid()).optional(),
  agendaItems: z.array(z.string().min(1)).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  meetingDate: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  discussionNotes: z.string().max(5000).optional().nullable(),
});

export const setReviewSectionSchema = z.object({
  reviewType: z.enum(REVIEW_TYPES),
  notes: z.string().max(2000).optional().nullable(),
});

export const addDecisionSchema = z.object({
  decisionText: z.string().min(1).max(1000),
});

export const createActionSchema = z.object({
  description: z.string().min(1).max(500),
  assignedTo: z.string().uuid(),
  targetDate: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const addAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
});
