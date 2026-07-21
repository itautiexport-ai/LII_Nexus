"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignationService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class DesignationService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.list();
    }
    async create(input, actorId) {
        const existing = await this.repo.findByTitle(input.title);
        if (existing)
            throw new DomainError_1.ConflictError("A designation with this title already exists.");
        const designation = await this.repo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "DESIGNATION_CREATED", entityType: "designation", entityId: designation.id, afterState: input });
        return designation;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Designation not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "DESIGNATION_UPDATED", entityType: "designation", entityId: id, beforeState: existing, afterState: updated });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Designation not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "DESIGNATION_DELETED", entityType: "designation", entityId: id });
    }
}
exports.DesignationService = DesignationService;
//# sourceMappingURL=DesignationService.js.map