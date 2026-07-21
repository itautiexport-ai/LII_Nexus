"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const Goal_1 = require("../../domain/entities/Goal");
class GoalService {
    constructor(goalRepo, scope) {
        this.goalRepo = goalRepo;
        this.scope = scope;
    }
    async listForEmployee(employeeId, actorUserId, hasViewOverride) {
        await this.scope.authorize(actorUserId, employeeId, hasViewOverride);
        const goals = await this.goalRepo.listForEmployee(employeeId);
        return goals.map((g) => ({ ...g, achievementPercentage: (0, Goal_1.computeAchievementPercentage)(g) }));
    }
    async create(input, actorUserId, hasCreateOverride) {
        await this.scope.authorize(actorUserId, input.employeeId, hasCreateOverride);
        const goal = await this.goalRepo.create({ id: (0, uuid_1.v4)(), createdBy: actorUserId, ...input });
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "GOAL_CREATED",
            entityType: "performance_goal",
            entityId: goal.id,
            afterState: { employeeId: goal.employeeId, title: goal.title, weight: goal.weight },
        });
        return goal;
    }
    async update(goalId, changes, actorUserId, hasUpdateOverride) {
        const goal = await this.goalRepo.findById(goalId);
        if (!goal)
            throw new DomainError_1.NotFoundError("Goal not found.");
        await this.scope.authorize(actorUserId, goal.employeeId, hasUpdateOverride);
        const updated = await this.goalRepo.update(goalId, changes);
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "GOAL_UPDATED",
            entityType: "performance_goal",
            entityId: goalId,
            beforeState: { title: goal.title, status: goal.status, weight: goal.weight },
            afterState: { title: updated.title, status: updated.status, weight: updated.weight },
        });
        return updated;
    }
    async remove(goalId, actorUserId, hasDeleteOverride) {
        const goal = await this.goalRepo.findById(goalId);
        if (!goal)
            throw new DomainError_1.NotFoundError("Goal not found.");
        await this.scope.authorize(actorUserId, goal.employeeId, hasDeleteOverride);
        await this.goalRepo.softDelete(goalId);
        await AuditService_1.AuditService.record({ actorUserId, action: "GOAL_CANCELLED", entityType: "performance_goal", entityId: goalId });
    }
    async logProgress(goalId, value, note, actorUserId, hasUpdateOverride) {
        const goal = await this.goalRepo.findById(goalId);
        if (!goal)
            throw new DomainError_1.NotFoundError("Goal not found.");
        await this.scope.authorize(actorUserId, goal.employeeId, hasUpdateOverride);
        const entry = await this.goalRepo.addProgressEntry({ id: (0, uuid_1.v4)(), goalId, value, note, recordedBy: actorUserId });
        await this.goalRepo.setCurrentValue(goalId, value);
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "GOAL_PROGRESS_LOGGED",
            entityType: "performance_goal",
            entityId: goalId,
            afterState: { value, note },
        });
        return entry;
    }
    async getProgressHistory(goalId, actorUserId, hasViewOverride) {
        const goal = await this.goalRepo.findById(goalId);
        if (!goal)
            throw new DomainError_1.NotFoundError("Goal not found.");
        await this.scope.authorize(actorUserId, goal.employeeId, hasViewOverride);
        return this.goalRepo.listProgressForGoal(goalId);
    }
}
exports.GoalService = GoalService;
//# sourceMappingURL=GoalService.js.map