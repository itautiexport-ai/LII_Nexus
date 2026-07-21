import { v4 as uuid } from "uuid";
import { IProductionEntryRepository } from "../../domain/repositories/IProductionEntryRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { computeAchievementPercentage } from "../../domain/entities/ProductionEntry";

interface CreateEntryInput {
  employeeId: string;
  lineId: string;
  shiftId: string;
  entryDate: string;
  quantityProduced: number;
  targetQuantity?: number | null;
  notes?: string | null;
}

interface UpdateEntryInput {
  quantityProduced?: number;
  targetQuantity?: number | null;
  notes?: string | null;
}

export class ProductionEntryService {
  constructor(private readonly entryRepo: IProductionEntryRepository, private readonly scope: EmployeeScopeService) {}

  /** Entries are logged by a supervisor "on behalf of" a worker, never by the
   *  worker themselves - so unlike Office Performance goals, self-service is
   *  intentionally not an escape hatch here. Only the employee's actual
   *  manager, or HR/admin via the override permission, may record for them. */
  private async assertCanRecordFor(employeeId: string, actorUserId: string, hasOverride: boolean) {
    return this.scope.authorizeManagerOnly(
      actorUserId,
      employeeId,
      hasOverride,
      "Only this employee's manager can record production entries on their behalf."
    );
  }

  /** Viewing is looser: the employee themselves, their manager, or an
   *  override permission holder can see the entries. */
  private async assertCanViewFor(employeeId: string, actorUserId: string, hasOverride: boolean) {
    return this.scope.authorize(actorUserId, employeeId, hasOverride);
  }

  async listForEmployee(employeeId: string, actorUserId: string, hasViewOverride: boolean, range?: { from?: string; to?: string }) {
    await this.assertCanViewFor(employeeId, actorUserId, hasViewOverride);
    const entries = await this.entryRepo.listForEmployee(employeeId, range);
    return entries.map((e) => ({ ...e, achievementPercentage: computeAchievementPercentage(e) }));
  }

  /** Supervisors record per line/shift/day for a roster of workers - this
   *  returns everyone already entered for that slot, with a computed total,
   *  so the "line total" is always a live aggregate, never a stored figure
   *  that can drift out of sync with the individual entries. */
  async getLineShiftSummary(lineId: string, shiftId: string, entryDate: string) {
    const entries = await this.entryRepo.listForLineShiftDate(lineId, shiftId, entryDate);
    const withAchievement = entries.map((e) => ({ ...e, achievementPercentage: computeAchievementPercentage(e) }));
    const totalProduced = entries.reduce((sum, e) => sum + e.quantityProduced, 0);
    const targets = entries.filter((e) => e.targetQuantity !== null);
    const totalTarget = targets.length > 0 ? targets.reduce((sum, e) => sum + (e.targetQuantity as number), 0) : null;
    const achievementPercentage = totalTarget && totalTarget > 0
      ? Math.round(Math.min(100, (totalProduced / totalTarget) * 100) * 100) / 100
      : null;

    return { lineId, shiftId, entryDate, totalProduced, totalTarget, achievementPercentage, entries: withAchievement };
  }

  async create(input: CreateEntryInput, actorUserId: string, hasCreateOverride: boolean) {
    await this.assertCanRecordFor(input.employeeId, actorUserId, hasCreateOverride);

    const existing = await this.entryRepo.findExisting(input.employeeId, input.lineId, input.shiftId, input.entryDate);
    if (existing) {
      throw new ConflictError("An entry for this employee/line/shift/date already exists. Update it instead of creating a new one.");
    }

    const entry = await this.entryRepo.create({ id: uuid(), recordedBy: actorUserId, ...input });
    await AuditService.record({
      actorUserId,
      action: "PRODUCTION_ENTRY_CREATED",
      entityType: "production_entry",
      entityId: entry.id,
      afterState: { employeeId: entry.employeeId, quantityProduced: entry.quantityProduced, targetQuantity: entry.targetQuantity },
    });
    return entry;
  }

  async update(entryId: string, changes: UpdateEntryInput, actorUserId: string, hasUpdateOverride: boolean) {
    const entry = await this.entryRepo.findById(entryId);
    if (!entry) throw new NotFoundError("Production entry not found.");
    await this.assertCanRecordFor(entry.employeeId, actorUserId, hasUpdateOverride);

    const updated = await this.entryRepo.update(entryId, changes);
    await AuditService.record({
      actorUserId,
      action: "PRODUCTION_ENTRY_UPDATED",
      entityType: "production_entry",
      entityId: entryId,
      beforeState: { quantityProduced: entry.quantityProduced, targetQuantity: entry.targetQuantity },
      afterState: { quantityProduced: updated.quantityProduced, targetQuantity: updated.targetQuantity },
    });
    return updated;
  }

  async remove(entryId: string, actorUserId: string, hasDeleteOverride: boolean) {
    const entry = await this.entryRepo.findById(entryId);
    if (!entry) throw new NotFoundError("Production entry not found.");
    await this.assertCanRecordFor(entry.employeeId, actorUserId, hasDeleteOverride);

    await this.entryRepo.softDelete(entryId);
    await AuditService.record({ actorUserId, action: "PRODUCTION_ENTRY_DELETED", entityType: "production_entry", entityId: entryId });
  }
}
