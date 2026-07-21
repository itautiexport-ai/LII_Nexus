"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerFeedbackService = void 0;
const uuid_1 = require("uuid");
const AuditService_1 = require("../../../../shared/services/AuditService");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
class ManagerFeedbackService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async submit(employeeId, periodType, periodKey, rating, comments, actorUserId, hasOverride) {
        // Manager-only, same reasoning as Delegation: feedback is submitted by
        // the direct manager (or an HR/admin override), not self-service.
        // authorizeManagerOnly validates and returns the TARGET (the direct
        // report being reviewed), not the acting manager - submitted_by needs
        // the actor's own employee id, resolved separately and best-effort
        // (nullable), so an admin override with no personal employee record
        // can still submit feedback on a manager's behalf.
        await this.scope.authorizeManagerOnly(actorUserId, employeeId, hasOverride, "You can only submit feedback for your direct reports.");
        const actorEmployee = await this.scope.getEmployeeForUser(actorUserId);
        const feedback = await this.repo.upsertManagerFeedback({ id: (0, uuid_1.v4)(), employeeId, submittedBy: actorEmployee?.id ?? null, periodType, periodKey, rating, comments });
        await AuditService_1.AuditService.record({ actorUserId, action: "MANAGER_FEEDBACK_SUBMITTED", entityType: "manager_feedback", entityId: feedback.id, afterState: { employeeId, periodType, periodKey, rating } });
        return feedback;
    }
    async listForEmployee(employeeId, actorUserId, hasViewOverride) {
        if (!hasViewOverride) {
            const actor = await this.scope.getEmployeeForUser(actorUserId);
            const target = await this.scope.getEmployeeById(employeeId);
            const isSelf = actor?.id === employeeId;
            const isManager = actor && target ? this.scope.isManagerOf(actor, target) : false;
            if (!isSelf && !isManager) {
                throw new DomainError_1.ForbiddenError("You can only view your own feedback or your direct reports'.");
            }
        }
        return this.repo.listManagerFeedbackForEmployee(employeeId);
    }
}
exports.ManagerFeedbackService = ManagerFeedbackService;
//# sourceMappingURL=ManagerFeedbackService.js.map