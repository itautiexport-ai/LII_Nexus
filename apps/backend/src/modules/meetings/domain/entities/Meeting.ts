export type MeetingType = "daily_production" | "weekly_executive" | "monthly_management_review" | "quarterly_review";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type ReviewType = "department" | "performance" | "factory" | "crm" | "sales" | "production" | "quality" | "purchase" | "hr" | "office_em";
export type ActionPriority = "low" | "medium" | "high" | "urgent";

export interface Meeting {
  id: string;
  meetingType: MeetingType;
  title: string;
  meetingDate: string;
  status: MeetingStatus;
  organizedBy: string | null;
  discussionNotes: string | null;
  previousMeetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgendaItem {
  id: string;
  meetingId: string;
  sortOrder: number;
  itemText: string;
}

export interface ReviewSection {
  id: string;
  meetingId: string;
  reviewType: ReviewType;
  reportTypeRef: string | null;
  notes: string | null;
}

export interface Decision {
  id: string;
  meetingId: string;
  decisionText: string;
  decidedAt: Date;
}

export interface MeetingAction {
  id: string;
  meetingId: string;
  description: string;
  assignedTo: string;
  targetDate: string;
  priority: ActionPriority;
  linkedDelegatedTaskId: string | null;
}

export interface MeetingActionWithStatus extends MeetingAction {
  assigneeName: string;
  status: "pending" | "running" | "completed" | "delayed";
}

export interface MeetingAttachment {
  id: string;
  meetingId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string | null;
  uploadedAt: Date;
}

/** Review types mapped to an existing Reports & BI report type, where one
 *  meaningfully exists. Purchase and HR have no automated data source
 *  anywhere in this system (no Purchasing or dedicated HR/leave module) -
 *  left unmapped deliberately, not filled in with an approximation. */
export const REVIEW_TYPE_REPORT_MAP: Partial<Record<ReviewType, string>> = {
  department: "department_performance",
  performance: "employee_performance",
  factory: "factory_performance",
  crm: "crm_reports",
  sales: "sales_pipeline",
  production: "production_reports",
  office_em: "office_performance",
};
