"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractorService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class ContractorService {
    constructor(repo) {
        this.repo = repo;
    }
    list(status) {
        return this.repo.list(status);
    }
    async create(input, actorId) {
        const contractor = await this.repo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "CONTRACTOR_CREATED", entityType: "contractor", entityId: contractor.id, afterState: input });
        return contractor;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Contractor not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "CONTRACTOR_UPDATED", entityType: "contractor", entityId: id });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Contractor not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "CONTRACTOR_DELETED", entityType: "contractor", entityId: id });
    }
}
exports.ContractorService = ContractorService;
//# sourceMappingURL=ContractorService.js.map