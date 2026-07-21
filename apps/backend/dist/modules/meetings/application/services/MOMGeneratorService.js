"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOMGeneratorService = void 0;
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
/**
 * "Generate MOM automatically" - genuinely automatic in the sense that no
 * one has to manually retype the meeting's structured data into a document;
 * this assembles the Minutes of Meeting from what was actually recorded
 * (agenda, attendees, decisions, actions, review notes) plus pending
 * actions carried forward from the previous meeting of the same type. It is
 * template-based assembly of real data, not AI-generated prose - consistent
 * with the Behaviour Intelligence Engine's Insights Engine, which took the
 * same honest approach.
 */
class MOMGeneratorService {
    constructor(repo) {
        this.repo = repo;
    }
    async generate(meetingId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const [attendees, agenda, reviewSections, decisions, actions] = await Promise.all([
            this.repo.listAttendees(meetingId), this.repo.listAgendaItems(meetingId), this.repo.listReviewSections(meetingId),
            this.repo.listDecisions(meetingId), this.repo.listActionsForMeeting(meetingId),
        ]);
        const attachments = await this.repo.listAttachments(meetingId);
        let carriedForward = [];
        if (meeting.previousMeetingId) {
            const previousActions = await this.repo.listActionsForMeeting(meeting.previousMeetingId);
            carriedForward = previousActions
                .filter((a) => a.status !== "completed")
                .map((a) => ({ description: a.description, assignee: a.assigneeName, targetDate: a.targetDate, status: a.status }));
        }
        return {
            meetingTitle: meeting.title,
            meetingType: meeting.meetingType,
            meetingDate: meeting.meetingDate,
            status: meeting.status,
            attendees: attendees.map((a) => a.fullName),
            agenda: agenda.map((a) => a.itemText),
            discussionNotes: meeting.discussionNotes,
            reviewSections: reviewSections.map((s) => ({ reviewType: s.reviewType, notes: s.notes, hasAutomatedData: s.reportTypeRef !== null })),
            decisions: decisions.map((d) => d.decisionText),
            actions: actions.map((a) => ({ description: a.description, assignee: a.assigneeName, targetDate: a.targetDate, priority: a.priority, status: a.status })),
            carriedForwardPendingActions: carriedForward,
            attachments: attachments.map((a) => a.fileName),
        };
    }
}
exports.MOMGeneratorService = MOMGeneratorService;
//# sourceMappingURL=MOMGeneratorService.js.map