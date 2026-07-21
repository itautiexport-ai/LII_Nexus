"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoryDepartmentService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class FactoryDepartmentService {
    constructor(repo) {
        this.repo = repo;
    }
    list(status) {
        return this.repo.list(status);
    }
    async create(input, actorId) {
        const existing = await this.repo.findByName(input.name);
        if (existing)
            throw new DomainError_1.ConflictError("A factory department with this name already exists.");
        const dept = await this.repo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_DEPARTMENT_CREATED", entityType: "factory_department", entityId: dept.id, afterState: input });
        return dept;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Factory department not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_DEPARTMENT_UPDATED", entityType: "factory_department", entityId: id, beforeState: existing, afterState: updated });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Factory department not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "FACTORY_DEPARTMENT_DELETED", entityType: "factory_department", entityId: id });
    }
}
exports.FactoryDepartmentService = FactoryDepartmentService;
//# sourceMappingURL=FactoryDepartmentService.js.map