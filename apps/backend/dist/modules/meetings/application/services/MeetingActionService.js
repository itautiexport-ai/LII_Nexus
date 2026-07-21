"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingActionService = void 0;
const uuid_1 = require("uuid");
const DelegationService_1 = require("../../../officeperf/application/services/DelegationService");
const MySqlDelegationRepository_1 = require("../../../officeperf/infrastructure/repositories/MySqlDelegationRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const scope = new EmployeeScopeService_1.EmployeeScopeService();
const delegationService = new DelegationService_1.DelegationService(new MySqlDelegationRepository_1.MySqlDelegationRepository(), scope);
/**
 * Every meeting action is a real Delegated Task, not a parallel tracker.
 * Creating one goes through DelegationService.create() - the exact same
 * path Office Performance's own Delegation UI uses - which means the
 * action automatically gets: a real notification via the Notification
 * Engine, a place in that employee's own Delegation list, and eligibility
 * for the Notification Engine's existing escalation ladder if it's not
 * completed. No second reminder/escalation mechanism was built for this
 * module; it inherits one that already exists and is already tested.
 */
class MeetingActionService {
    constructor(repo) {
        this.repo = repo;
    }
    async createAction(meetingId, description, assignedTo, targetDate, priority, actorUserId, hasAssignAnyOverride) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw new DomainError_1.NotFoundError("Meeting not found.");
        const delegatedTask = await delegationService.create({ title: `[${meeting.title}] ${description}`, description, assignedTo, dueDate: targetDate, priority }, actorUserId, hasAssignAnyOverride);
        const action = await this.repo.createAction({
            id: (0, uuid_1.v4)(), meetingId, description, assignedTo, targetDate, priority: priority ?? "medium", linkedDelegatedTaskId: delegatedTask.id,
        });
        await AuditService_1.AuditService.record({
            actorUserId, action: "MEETING_ACTION_CREATED", entityType: "meeting_action", entityId: action.id,
            afterState: { meetingId, assignedTo, targetDate, linkedDelegatedTaskId: delegatedTask.id },
        });
        return action;
    }
    listForMeeting(meetingId) {
        return this.repo.listActionsForMeeting(meetingId);
    }
    listPending() {
        return this.repo.listPendingActions();
    }
    listCompleted() {
        return this.repo.listCompletedActions();
    }
}
exports.MeetingActionService = MeetingActionService;
//# sourceMappingURL=MeetingActionService.js.map