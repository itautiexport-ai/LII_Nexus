import { v4 as uuid } from "uuid";
import { IMeetingRepository, ListMeetingsParams } from "../../domain/repositories/IMeetingRepository";
import { MeetingStatus, MeetingType, ReviewType, REVIEW_TYPE_REPORT_MAP } from "../../domain/entities/Meeting";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class MeetingService {
  constructor(private readonly repo: IMeetingRepository, private readonly scope: EmployeeScopeService) {}

  async create(input: { meetingType: MeetingType; title: string; meetingDate: string; attendeeIds?: string[]; agendaItems?: string[] }, actorUserId: string) {
    const organizer = await this.scope.getEmployeeForUser(actorUserId);
    // Auto-link "Previous MOM" to the most recent earlier meeting of the
    // SAME type - this is what carries forward pending actions and gives
    // the MOM generator its "previous meeting" reference, with no manual
    // linking step required.
    const previous = await this.repo.findLatestByType(input.meetingType, input.meetingDate);

    const meeting = await this.repo.create({
      id: uuid(), meetingType: input.meetingType, title: input.title, meetingDate: input.meetingDate,
      organizedBy: organizer?.id ?? null, previousMeetingId: previous?.id ?? null,
    });

    for (const employeeId of input.attendeeIds ?? []) await this.repo.addAttendee(meeting.id, employeeId);
    for (const [i, text] of (input.agendaItems ?? []).entries()) await this.repo.addAgendaItem(meeting.id, text, i);

    await AuditService.record({ actorUserId, action: "MEETING_CREATED", entityType: "meeting", entityId: meeting.id, afterState: { meetingType: meeting.meetingType, title: meeting.title } });
    return this.getDetail(meeting.id);
  }

  async getDetail(id: string) {
    const meeting = await this.repo.findById(id);
    if (!meeting) throw new NotFoundError("Meeting not found.");
    const [attendees, agendaItems, reviewSections, decisions, actions, attachments] = await Promise.all([
      this.repo.listAttendees(id), this.repo.listAgendaItems(id), this.repo.listReviewSections(id),
      this.repo.listDecisions(id), this.repo.listActionsForMeeting(id), this.repo.listAttachments(id),
    ]);
    return { ...meeting, attendees, agendaItems, reviewSections, decisions, actions, attachments };
  }

  list(params: ListMeetingsParams) {
    return this.repo.list(params);
  }

  async update(id: string, changes: Partial<{ title: string; meetingDate: string; status: MeetingStatus; discussionNotes: string | null }>, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Meeting not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId, action: "MEETING_UPDATED", entityType: "meeting", entityId: id, afterState: changes });
    return updated;
  }

  async remove(id: string, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Meeting not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId, action: "MEETING_DELETED", entityType: "meeting", entityId: id });
  }

  async setReviewSection(meetingId: string, reviewType: ReviewType, notes: string | null, actorUserId: string) {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw new NotFoundError("Meeting not found.");
    const section = await this.repo.upsertReviewSection(meetingId, reviewType, REVIEW_TYPE_REPORT_MAP[reviewType] ?? null, notes);
    await AuditService.record({ actorUserId, action: "MEETING_REVIEW_SECTION_UPDATED", entityType: "meeting", entityId: meetingId, afterState: { reviewType } });
    return section;
  }

  async addDecision(meetingId: string, decisionText: string, actorUserId: string) {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw new NotFoundError("Meeting not found.");
    const decision = await this.repo.addDecision(meetingId, decisionText);
    await AuditService.record({ actorUserId, action: "MEETING_DECISION_RECORDED", entityType: "meeting", entityId: meetingId, afterState: { decisionText } });
    return decision;
  }

  async addAttachment(meetingId: string, fileName: string, fileUrl: string, actorUserId: string) {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw new NotFoundError("Meeting not found.");
    const actorEmployee = await this.scope.getEmployeeForUser(actorUserId);
    const attachment = await this.repo.addAttachment(meetingId, fileName, fileUrl, actorEmployee?.id ?? null);
    await AuditService.record({ actorUserId, action: "MEETING_ATTACHMENT_ADDED", entityType: "meeting", entityId: meetingId, afterState: { fileName } });
    return attachment;
  }
}
