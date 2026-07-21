"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoryProductionEntryService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class FactoryProductionEntryService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    /** Reports only ever show approved entries - unapproved work-in-progress
     *  submissions should never leak into management reporting, per the
     *  "Approved -> Visible in Reports" requirement. Callers that need the
     *  working queue (supervisors/production heads reviewing) pass their own
     *  status filter instead of relying on this default. */
    async list(params, forReportsOnly) {
        return this.repo.list(forReportsOnly ? { ...params, status: "approved" } : params);
    }
    async getById(id) {
        const entry = await this.repo.getWithContext(id);
        if (!entry)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        return entry;
    }
    async create(input, actorId) {
        // submitted_by is a foreign key to employees, not users - resolve the
        // acting user's own employee record rather than passing the user id
        // straight through (that FK mismatch caused a 500 the first time this
        // was tested against a real database).
        const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
        const entry = await this.repo.create({ id: (0, uuid_1.v4)(), submittedBy: actorEmployee.id, ...input });
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "FACTORY_ENTRY_SUBMITTED",
            entityType: "factory_production_entry",
            entityId: entry.id,
            afterState: { entryDate: entry.entryDate, method: entry.productionMethod },
        });
        return entry;
    }
    async update(id, changes, actorId, hasUpdateOverride) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        if (existing.status !== "submitted") {
            throw new DomainError_1.ConflictError("Only entries still awaiting approval can be edited. This entry has already been reviewed.");
        }
        if (!hasUpdateOverride) {
            const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
            if (existing.submittedBy !== actorEmployee.id) {
                throw new DomainError_1.ForbiddenError("Only the supervisor who submitted this entry can edit it before it's reviewed.");
            }
        }
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_UPDATED", entityType: "factory_production_entry", entityId: id });
        return updated;
    }
    async approve(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        if (existing.status !== "submitted") {
            throw new DomainError_1.ConflictError(`This entry is already ${existing.status} and cannot be re-approved.`);
        }
        const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
        const updated = await this.repo.approve(id, actorEmployee.id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_APPROVED", entityType: "factory_production_entry", entityId: id });
        return updated;
    }
    async reject(id, reason, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        if (existing.status !== "submitted") {
            throw new DomainError_1.ConflictError(`This entry is already ${existing.status} and cannot be rejected.`);
        }
        const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
        const updated = await this.repo.reject(id, actorEmployee.id, reason);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_REJECTED", entityType: "factory_production_entry", entityId: id, afterState: { reason } });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_DELETED", entityType: "factory_production_entry", entityId: id });
    }
    async addFile(id, kind, fileName, fileUrl, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production entry not found.");
        await this.repo.addFile(id, kind, fileName, fileUrl, actorId);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_FILE_ADDED", entityType: "factory_production_entry", entityId: id, afterState: { kind, fileName } });
        return this.repo.getWithContext(id);
    }
}
exports.FactoryProductionEntryService = FactoryProductionEntryService;
//# sourceMappingURL=FactoryProductionEntryService.js.map