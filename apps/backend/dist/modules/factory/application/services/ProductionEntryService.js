"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEntryService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const ProductionEntry_1 = require("../../domain/entities/ProductionEntry");
class ProductionEntryService {
    constructor(entryRepo, scope) {
        this.entryRepo = entryRepo;
        this.scope = scope;
    }
    /** Entries are logged by a supervisor "on behalf of" a worker, never by the
     *  worker themselves - so unlike Office Performance goals, self-service is
     *  intentionally not an escape hatch here. Only the employee's actual
     *  manager, or HR/admin via the override permission, may record for them. */
    async assertCanRecordFor(employeeId, actorUserId, hasOverride) {
        return this.scope.authorizeManagerOnly(actorUserId, employeeId, hasOverride, "Only this employee's manager can record production entries on their behalf.");
    }
    /** Viewing is looser: the employee themselves, their manager, or an
     *  override permission holder can see the entries. */
    async assertCanViewFor(employeeId, actorUserId, hasOverride) {
        return this.scope.authorize(actorUserId, employeeId, hasOverride);
    }
    async listForEmployee(employeeId, actorUserId, hasViewOverride, range) {
        await this.assertCanViewFor(employeeId, actorUserId, hasViewOverride);
        const entries = await this.entryRepo.listForEmployee(employeeId, range);
        return entries.map((e) => ({ ...e, achievementPercentage: (0, ProductionEntry_1.computeAchievementPercentage)(e) }));
    }
    /** Supervisors record per line/shift/day for a roster of workers - this
     *  returns everyone already entered for that slot, with a computed total,
     *  so the "line total" is always a live aggregate, never a stored figure
     *  that can drift out of sync with the individual entries. */
    async getLineShiftSummary(lineId, shiftId, entryDate) {
        const entries = await this.entryRepo.listForLineShiftDate(lineId, shiftId, entryDate);
        const withAchievement = entries.map((e) => ({ ...e, achievementPercentage: (0, ProductionEntry_1.computeAchievementPercentage)(e) }));
        const totalProduced = entries.reduce((sum, e) => sum + e.quantityProduced, 0);
        const targets = entries.filter((e) => e.targetQuantity !== null);
        const totalTarget = targets.length > 0 ? targets.reduce((sum, e) => sum + e.targetQuantity, 0) : null;
        const achievementPercentage = totalTarget && totalTarget > 0
            ? Math.round(Math.min(100, (totalProduced / totalTarget) * 100) * 100) / 100
            : null;
        return { lineId, shiftId, entryDate, totalProduced, totalTarget, achievementPercentage, entries: withAchievement };
    }
    async create(input, actorUserId, hasCreateOverride) {
        await this.assertCanRecordFor(input.employeeId, actorUserId, hasCreateOverride);
        const existing = await this.entryRepo.findExisting(input.employeeId, input.lineId, input.shiftId, input.entryDate);
        if (existing) {
            throw new DomainError_1.ConflictError("An entry for this employee/line/shift/date already exists. Update it instead of creating a new one.");
        }
        const entry = await this.entryRepo.create({ id: (0, uuid_1.v4)(), recordedBy: actorUserId, ...input });
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "PRODUCTION_ENTRY_CREATED",
            entityType: "production_entry",
            entityId: entry.id,
            afterState: { employeeId: entry.employeeId, quantityProduced: entry.quantityProduced, targetQuantity: entry.targetQuantity },
        });
        return entry;
    }
    async update(entryId, changes, actorUserId, hasUpdateOverride) {
        const entry = await this.entryRepo.findById(entryId);
        if (!entry)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        await this.assertCanRecordFor(entry.employeeId, actorUserId, hasUpdateOverride);
        const updated = await this.entryRepo.update(entryId, changes);
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "PRODUCTION_ENTRY_UPDATED",
            entityType: "production_entry",
            entityId: entryId,
            beforeState: { quantityProduced: entry.quantityProduced, targetQuantity: entry.targetQuantity },
            afterState: { quantityProduced: updated.quantityProduced, targetQuantity: updated.targetQuantity },
        });
        return updated;
    }
    async remove(entryId, actorUserId, hasDeleteOverride) {
        const entry = await this.entryRepo.findById(entryId);
        if (!entry)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        await this.assertCanRecordFor(entry.employeeId, actorUserId, hasDeleteOverride);
        await this.entryRepo.softDelete(entryId);
        await AuditService_1.AuditService.record({ actorUserId, action: "PRODUCTION_ENTRY_DELETED", entityType: "production_entry", entityId: entryId });
    }
}
exports.ProductionEntryService = ProductionEntryService;
//# sourceMappingURL=ProductionEntryService.js.map