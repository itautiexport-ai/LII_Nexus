import { v4 as uuid } from "uuid";
import { IMeetingRepository } from "../../domain/repositories/IMeetingRepository";
import { ActionPriority } from "../../domain/entities/Meeting";
import { DelegationService } from "../../../officeperf/application/services/DelegationService";
import { MySqlDelegationRepository } from "../../../officeperf/infrastructure/repositories/MySqlDelegationRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

const scope = new EmployeeScopeService();
const delegationService = new DelegationService(new MySqlDelegationRepository(), scope);

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
export class MeetingActionService {
  constructor(private readonly repo: IMeetingRepository) {}

  async createAction(meetingId: string, description: string, assignedTo: string, targetDate: string, priority: ActionPriority | undefined, actorUserId: string, hasAssignAnyOverride: boolean) {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw new NotFoundError("Meeting not found.");

    const delegatedTask = await delegationService.create(
      { title: `[${meeting.title}] ${description}`, description, assignedTo, dueDate: targetDate, priority },
      actorUserId,
      hasAssignAnyOverride
    );

    const action = await this.repo.createAction({
      id: uuid(), meetingId, description, assignedTo, targetDate, priority: priority ?? "medium", linkedDelegatedTaskId: delegatedTask.id,
    });

    await AuditService.record({
      actorUserId, action: "MEETING_ACTION_CREATED", entityType: "meeting_action", entityId: action.id,
      afterState: { meetingId, assignedTo, targetDate, linkedDelegatedTaskId: delegatedTask.id },
    });
    return action;
  }

  listForMeeting(meetingId: string) {
    return this.repo.listActionsForMeeting(meetingId);
  }

  listPending() {
    return this.repo.listPendingActions();
  }

  listCompleted() {
    return this.repo.listCompletedActions();
  }
}
