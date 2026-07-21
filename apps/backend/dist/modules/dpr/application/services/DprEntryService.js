"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DprEntryService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class DprEntryService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async list(params) {
        return this.repo.list(params);
    }
    async getById(id) {
        const entry = await this.repo.getWithContext(id);
        if (!entry)
            throw new DomainError_1.NotFoundError("DPR entry not found.");
        return entry;
    }
    async create(input, actorId) {
        const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
        // Auto-calculate totals from items if not provided manually
        const calcAchievement = input.items.reduce((sum, item) => sum + (item.qtyAsPerUom ?? 0), 0);
        const calcRework = input.items.reduce((sum, item) => sum + (item.reworkQty || 0), 0);
        const totalAchievement = input.totalAchievement ?? calcAchievement;
        const totalRework = input.totalRework ?? calcRework;
        const data = {
            id: (0, uuid_1.v4)(),
            entryDate: input.entryDate,
            shiftId: input.shiftId,
            factoryDepartmentId: input.factoryDepartmentId,
            supervisorId: input.supervisorId,
            hodId: input.hodId || null,
            totalTarget: input.totalTarget,
            uom: input.uom,
            totalAchievement,
            totalRework,
            totalOperator: input.totalOperator,
            totalHelper: input.totalHelper,
            totalContractor: input.totalContractor,
            manpowerDepartmentId: input.manpowerDepartmentId ?? null,
            submittedBy: actorEmployee.id,
            items: input.items.map((item, idx) => ({
                id: (0, uuid_1.v4)(),
                aliasName: item.aliasName ?? null,
                productCode: item.productCode ?? null,
                woodType: item.woodType ?? null,
                orderQty: item.orderQty,
                okQty: item.okQty,
                reworkQty: item.reworkQty,
                uom: item.uom,
                qtyAsPerUom: item.qtyAsPerUom ?? null,
                sortOrder: idx,
            })),
        };
        const entry = await this.repo.create(data);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "DPR_ENTRY_CREATED",
            entityType: "dpr_entry",
            entityId: entry.id,
            afterState: { entryDate: entry.entryDate, itemCount: data.items.length },
        });
        return this.repo.getWithContext(entry.id);
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("DPR entry not found.");
        const { items, ...headerChanges } = changes;
        const updateData = { ...headerChanges };
        // If items are provided, recalculate totals (unless provided manually)
        if (items) {
            const calcAchievement = items.reduce((sum, item) => sum + (item.qtyAsPerUom ?? 0), 0);
            const calcRework = items.reduce((sum, item) => sum + (item.reworkQty || 0), 0);
            updateData.totalAchievement = changes.totalAchievement ?? calcAchievement;
            updateData.totalRework = changes.totalRework ?? calcRework;
            updateData.items = items.map((item, idx) => ({
                id: (0, uuid_1.v4)(),
                aliasName: item.aliasName ?? null,
                productCode: item.productCode ?? null,
                woodType: item.woodType ?? null,
                orderQty: item.orderQty,
                okQty: item.okQty,
                reworkQty: item.reworkQty,
                uom: item.uom,
                qtyAsPerUom: item.qtyAsPerUom ?? null,
                sortOrder: idx,
            }));
        }
        const updated = await this.repo.update(id, updateData);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "DPR_ENTRY_UPDATED",
            entityType: "dpr_entry",
            entityId: id,
        });
        return this.repo.getWithContext(updated.id);
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("DPR entry not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "DPR_ENTRY_DELETED",
            entityType: "dpr_entry",
            entityId: id,
        });
    }
}
exports.DprEntryService = DprEntryService;
//# sourceMappingURL=DprEntryService.js.map