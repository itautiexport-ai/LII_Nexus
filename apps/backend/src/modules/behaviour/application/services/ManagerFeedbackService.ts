import { v4 as uuid } from "uuid";
import { IBehaviourRepository } from "../../domain/repositories/IBehaviourRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { PeriodType } from "../../domain/entities/Behaviour";
import { AuditService } from "../../../../shared/services/AuditService";
import { ForbiddenError } from "../../../../core/domain/errors/DomainError";

export class ManagerFeedbackService {
  constructor(private readonly repo: IBehaviourRepository, private readonly scope: EmployeeScopeService) {}

  async submit(employeeId: string, periodType: PeriodType, periodKey: string, rating: number, comments: string | undefined, actorUserId: string, hasOverride: boolean) {
    // Manager-only, same reasoning as Delegation: feedback is submitted by
    // the direct manager (or an HR/admin override), not self-service.
    // authorizeManagerOnly validates and returns the TARGET (the direct
    // report being reviewed), not the acting manager - submitted_by needs
    // the actor's own employee id, resolved separately and best-effort
    // (nullable), so an admin override with no personal employee record
    // can still submit feedback on a manager's behalf.
    await this.scope.authorizeManagerOnly(actorUserId, employeeId, hasOverride, "You can only submit feedback for your direct reports.");
    const actorEmployee = await this.scope.getEmployeeForUser(actorUserId);
    const feedback = await this.repo.upsertManagerFeedback({ id: uuid(), employeeId, submittedBy: actorEmployee?.id ?? null, periodType, periodKey, rating, comments });
    await AuditService.record({ actorUserId, action: "MANAGER_FEEDBACK_SUBMITTED", entityType: "manager_feedback", entityId: feedback.id, afterState: { employeeId, periodType, periodKey, rating } });
    return feedback;
  }

  async listForEmployee(employeeId: string, actorUserId: string, hasViewOverride: boolean) {
    if (!hasViewOverride) {
      const actor = await this.scope.getEmployeeForUser(actorUserId);
      const target = await this.scope.getEmployeeById(employeeId);
      const isSelf = actor?.id === employeeId;
      const isManager = actor && target ? this.scope.isManagerOf(actor, target) : false;
      if (!isSelf && !isManager) {
        throw new ForbiddenError("You can only view your own feedback or your direct reports'.");
      }
    }
    return this.repo.listManagerFeedbackForEmployee(employeeId);
  }
}
