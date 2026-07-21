"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingService = void 0;
const uuid_1 = require("uuid");
const Meeting_1 = require("../../domain/entities/Meeting");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class MeetingService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async create(input, actorUserId) {
        const organizer = await this.scope.getEmployeeForUser(actorUserId);
        // Auto-link "Previous MOM" to the most recent earlier meeting of the
        // SAME type - this is what carries forward pending actions and gives
        // the MOM generator its "previous meeting" reference, with no manual
        // linking step required.
        const previous = await this.repo.findLatestByType(input.meetingType, input.meetingDate);
        const meeting = await this.repo.create({
            id: (0, uuid_1.v4)(), meetingType: input.meetingType, title: input.title, meetingDate: input.meetingDate,
            organizedBy: organizer?.id ?? null, previousMeetingId: previous?.id ?? null,
        });
        for (const employeeId of input.attendeeIds ?? [])
            await this.repo.addAttendee(meeting.id, employeeId);
        for (const [i, text] of (input.agendaItems ?? []).entries())
            await this.repo.addAgendaItem(meeting.id, text, i);
        await AuditService_1.AuditService.record({ actorUserId, action: "MEETING_CREATED", entityType: "meeting", entityId: meeting.id, afterState: { meetingType: meeting.meetingType, title: meeting.title } });
        return this.getDetail(meeting.id);
    }
    async getDetail(id) {
        const meeting = await this.repo.findById(id);
        if (!meeting)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const [attendees, agendaItems, reviewSections, decisions, actions, attachments] = await Promise.all([
            this.repo.listAttendees(id), this.repo.listAgendaItems(id), this.repo.listReviewSections(id),
            this.repo.listDecisions(id), this.repo.listActionsForMeeting(id), this.repo.listAttachments(id),
        ]);
        return { ...meeting, attendees, agendaItems, reviewSections, decisions, actions, attachments };
    }
    list(params) {
        return this.repo.list(params);
    }
    async update(id, changes, actorUserId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId, action: "MEETING_UPDATED", entityType: "meeting", entityId: id, afterState: changes });
        return updated;
    }
    async remove(id, actorUserId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId, action: "MEETING_DELETED", entityType: "meeting", entityId: id });
    }
    async setReviewSection(meetingId, reviewType, notes, actorUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const section = await this.repo.upsertReviewSection(meetingId, reviewType, Meeting_1.REVIEW_TYPE_REPORT_MAP[reviewType] ?? null, notes);
        await AuditService_1.AuditService.record({ actorUserId, action: "MEETING_REVIEW_SECTION_UPDATED", entityType: "meeting", entityId: meetingId, afterState: { reviewType } });
        return section;
    }
    async addDecision(meetingId, decisionText, actorUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const decision = await this.repo.addDecision(meetingId, decisionText);
        await AuditService_1.AuditService.record({ actorUserId, action: "MEETING_DECISION_RECORDED", entityType: "meeting", entityId: meetingId, afterState: { decisionText } });
        return decision;
    }
    async addAttachment(meetingId, fileName, fileUrl, actorUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const actorEmployee = await this.scope.getEmployeeForUser(actorUserId);
        const attachment = await this.repo.addAttachment(meetingId, fileName, fileUrl, actorEmployee?.id ?? null);
        await AuditService_1.AuditService.record({ actorUserId, action: "MEETING_ATTACHMENT_ADDED", entityType: "meeting", entityId: meetingId, afterState: { fileName } });
        return attachment;
    }
}
exports.MeetingService = MeetingService;
//# sourceMappingURL=MeetingService.js.map