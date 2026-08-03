import { axiosInstance } from "../../../services/api/axiosInstance";

export type MeetingType = "daily_production" | "weekly_executive" | "monthly_management_review" | "quarterly_review";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type ReviewType = "department" | "performance" | "factory" | "crm" | "sales" | "production" | "quality" | "purchase" | "hr" | "office_em";

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  daily_production: "Daily Production Meeting",
  weekly_executive: "Weekly Executive Meeting",
  monthly_management_review: "Monthly Management Review",
  quarterly_review: "Quarterly Review",
};

export const REVIEW_TYPES: ReviewType[] = ["department", "performance", "factory", "crm", "sales", "production", "quality", "purchase", "hr", "office_em"];

export interface MeetingRecord {
  id: string;
  meetingType: MeetingType;
  title: string;
  meetingDate: string;
  status: MeetingStatus;
  discussionNotes: string | null;
  previousMeetingId: string | null;
}

export interface MeetingDetail extends MeetingRecord {
  attendees: { employeeId: string; fullName: string }[];
  agendaItems: { id: string; itemText: string }[];
  reviewSections: { id: string; reviewType: ReviewType; reportTypeRef: string | null; notes: string | null }[];
  decisions: { id: string; decisionText: string; decidedAt: string }[];
  actions: { id: string; description: string; assigneeName: string; targetDate: string; priority: string; status: string }[];
  attachments: { id: string; fileName: string }[];
}

export interface MOMDocument {
  meetingTitle: string;
  meetingType: string;
  meetingDate: string;
  status: string;
  attendees: string[];
  agenda: string[];
  discussionNotes: string | null;
  reviewSections: { reviewType: string; notes: string | null; hasAutomatedData: boolean }[];
  decisions: string[];
  actions: { description: string; assignee: string; targetDate: string; priority: string; status: string }[];
  carriedForwardPendingActions: { description: string; assignee: string; targetDate: string; status: string }[];
  attachments: string[];
}

export const meetingApi = {
  async list(params: Record<string, string | undefined> = {}) {
    const res = await axiosInstance.get("/meetings", { params: { page: 1, pageSize: 20, ...params } });
    return { items: res.data.data as MeetingRecord[], totalItems: res.data.meta.totalItems as number };
  },
  async getById(id: string): Promise<MeetingDetail> { return (await axiosInstance.get(`/meetings/${id}`)).data.data; },
  async create(payload: { meetingType: MeetingType; title: string; meetingDate: string; attendeeIds?: string[]; agendaItems?: string[] }) {
    return (await axiosInstance.post("/meetings", payload)).data.data as MeetingDetail;
  },
  async update(id: string, payload: Partial<{ title: string; meetingDate: string; status: MeetingStatus; discussionNotes: string | null }>) {
    return (await axiosInstance.patch(`/meetings/${id}`, payload)).data.data;
  },
  async remove(id: string) { await axiosInstance.delete(`/meetings/${id}`); },

  async setReviewSection(id: string, reviewType: ReviewType, notes?: string) {
    return (await axiosInstance.put(`/meetings/${id}/review-sections`, { reviewType, notes })).data.data;
  },
  async addDecision(id: string, decisionText: string) { return (await axiosInstance.post(`/meetings/${id}/decisions`, { decisionText })).data.data; },
  async addAttachment(id: string, fileName: string, fileUrl: string) { return (await axiosInstance.post(`/meetings/${id}/attachments`, { fileName, fileUrl })).data.data; },
  async createAction(id: string, description: string, assignedTo: string, targetDate: string, priority?: string) {
    return (await axiosInstance.post(`/meetings/${id}/actions`, { description, assignedTo, targetDate, priority })).data.data;
  },

  async getMom(id: string): Promise<MOMDocument> { return (await axiosInstance.get(`/meetings/${id}/mom`)).data.data; },
  async exportMomPdf(id: string, title: string) {
    const res = await axiosInstance.get(`/meetings/${id}/mom/export`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOM-${title.replace(/\s+/g, "-")}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async dashboard() { return (await axiosInstance.get("/meetings/dashboard")).data.data; },
  async pendingActions() { return (await axiosInstance.get("/meetings/actions/pending")).data.data; },
  async completedActions() { return (await axiosInstance.get("/meetings/actions/completed")).data.data; },
};
