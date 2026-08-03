import { v4 as uuid } from "uuid";
import { IGoalRepository } from "../../domain/repositories/IGoalRepository";
import { EmployeeScopeService } from "./EmployeeScopeService";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { computeAchievementPercentage } from "../../domain/entities/Goal";

interface CreateGoalInput {
  employeeId: string;
  title: string;
  description?: string | null;
  unit?: string | null;
  targetValue?: number | null;
  weight?: number;
  startDate?: string | null;
  targetDate?: string | null;
}

interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  unit?: string | null;
  targetValue?: number | null;
  weight?: number;
  status?: "active" | "completed" | "cancelled";
  startDate?: string | null;
  targetDate?: string | null;
}

export class GoalService {
  constructor(private readonly goalRepo: IGoalRepository, private readonly scope: EmployeeScopeService) {}

  async listForEmployee(employeeId: string, actorUserId: string, hasViewOverride: boolean) {
    await this.scope.authorize(actorUserId, employeeId, hasViewOverride);

    const goals = await this.goalRepo.listForEmployee(employeeId);
    return goals.map((g) => ({ ...g, achievementPercentage: computeAchievementPercentage(g) }));
  }

  async create(input: CreateGoalInput, actorUserId: string, hasCreateOverride: boolean) {
    await this.scope.authorize(actorUserId, input.employeeId, hasCreateOverride);

    const goal = await this.goalRepo.create({ id: uuid(), createdBy: actorUserId, ...input });
    await AuditService.record({
      actorUserId,
      action: "GOAL_CREATED",
      entityType: "performance_goal",
      entityId: goal.id,
      afterState: { employeeId: goal.employeeId, title: goal.title, weight: goal.weight },
    });
    return goal;
  }

  async update(goalId: string, changes: UpdateGoalInput, actorUserId: string, hasUpdateOverride: boolean) {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) throw new NotFoundError("Goal not found.");
    await this.scope.authorize(actorUserId, goal.employeeId, hasUpdateOverride);

    const updated = await this.goalRepo.update(goalId, changes);
    await AuditService.record({
      actorUserId,
      action: "GOAL_UPDATED",
      entityType: "performance_goal",
      entityId: goalId,
      beforeState: { title: goal.title, status: goal.status, weight: goal.weight },
      afterState: { title: updated.title, status: updated.status, weight: updated.weight },
    });
    return updated;
  }

  async remove(goalId: string, actorUserId: string, hasDeleteOverride: boolean) {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) throw new NotFoundError("Goal not found.");
    await this.scope.authorize(actorUserId, goal.employeeId, hasDeleteOverride);

    await this.goalRepo.softDelete(goalId);
    await AuditService.record({ actorUserId, action: "GOAL_CANCELLED", entityType: "performance_goal", entityId: goalId });
  }

  async logProgress(goalId: string, value: number, note: string | null | undefined, actorUserId: string, hasUpdateOverride: boolean) {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) throw new NotFoundError("Goal not found.");
    await this.scope.authorize(actorUserId, goal.employeeId, hasUpdateOverride);

    const entry = await this.goalRepo.addProgressEntry({ id: uuid(), goalId, value, note, recordedBy: actorUserId });
    await this.goalRepo.setCurrentValue(goalId, value);

    await AuditService.record({
      actorUserId,
      action: "GOAL_PROGRESS_LOGGED",
      entityType: "performance_goal",
      entityId: goalId,
      afterState: { value, note },
    });
    return entry;
  }

  async getProgressHistory(goalId: string, actorUserId: string, hasViewOverride: boolean) {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) throw new NotFoundError("Goal not found.");
    await this.scope.authorize(actorUserId, goal.employeeId, hasViewOverride);

    return this.goalRepo.listProgressForGoal(goalId);
  }
}
