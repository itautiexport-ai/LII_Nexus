import {
  ActionPriority, AgendaItem, Decision, Meeting, MeetingAction, MeetingActionWithStatus, MeetingAttachment,
  MeetingStatus, MeetingType, ReviewSection, ReviewType,
} from "../entities/Meeting";

export interface CreateMeetingData {
  id: string;
  meetingType: MeetingType;
  title: string;
  meetingDate: string;
  organizedBy: string | null;
  previousMeetingId?: string | null;
}

export interface ListMeetingsParams {
  page: number;
  pageSize: number;
  search?: string;
  meetingType?: MeetingType;
  status?: MeetingStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface IMeetingRepository {
  create(data: CreateMeetingData): Promise<Meeting>;
  findById(id: string): Promise<Meeting | null>;
  findLatestByType(meetingType: MeetingType, beforeDate: string): Promise<Meeting | null>;
  list(params: ListMeetingsParams): Promise<{ items: Meeting[]; total: number }>;
  update(id: string, changes: Partial<{ title: string; meetingDate: string; status: MeetingStatus; discussionNotes: string | null }>): Promise<Meeting>;
  softDelete(id: string): Promise<void>;

  addAttendee(meetingId: string, employeeId: string): Promise<void>;
  listAttendees(meetingId: string): Promise<{ employeeId: string; fullName: string }[]>;

  addAgendaItem(meetingId: string, itemText: string, sortOrder: number): Promise<AgendaItem>;
  listAgendaItems(meetingId: string): Promise<AgendaItem[]>;

  upsertReviewSection(meetingId: string, reviewType: ReviewType, reportTypeRef: string | null, notes: string | null): Promise<ReviewSection>;
  listReviewSections(meetingId: string): Promise<ReviewSection[]>;

  addDecision(meetingId: string, decisionText: string): Promise<Decision>;
  listDecisions(meetingId: string): Promise<Decision[]>;

  createAction(data: { id: string; meetingId: string; description: string; assignedTo: string; targetDate: string; priority: ActionPriority; linkedDelegatedTaskId: string | null }): Promise<MeetingAction>;
  listActionsForMeeting(meetingId: string): Promise<MeetingActionWithStatus[]>;
  listPendingActions(): Promise<MeetingActionWithStatus[]>;
  listCompletedActions(): Promise<MeetingActionWithStatus[]>;

  addAttachment(meetingId: string, fileName: string, fileUrl: string, uploadedBy: string | null): Promise<MeetingAttachment>;
  listAttachments(meetingId: string): Promise<MeetingAttachment[]>;
}
