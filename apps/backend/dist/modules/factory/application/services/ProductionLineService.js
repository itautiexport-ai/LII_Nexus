"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionLineService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class ProductionLineService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.list();
    }
    async create(input, actorId) {
        const existing = await this.repo.findByName(input.name);
        if (existing)
            throw new DomainError_1.ConflictError("A production line with this name already exists.");
        const line = await this.repo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "PRODUCTION_LINE_CREATED", entityType: "production_line", entityId: line.id, afterState: input });
        return line;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production line not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "PRODUCTION_LINE_UPDATED", entityType: "production_line", entityId: id, beforeState: existing, afterState: updated });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Production line not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "PRODUCTION_LINE_DELETED", entityType: "production_line", entityId: id });
    }
}
exports.ProductionLineService = ProductionLineService;
//# sourceMappingURL=ProductionLineService.js.map