"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class DepartmentService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.list();
    }
    async create(input, actorId) {
        const existing = await this.repo.findByName(input.name);
        if (existing)
            throw new DomainError_1.ConflictError("A department with this name already exists.");
        const department = await this.repo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "DEPARTMENT_CREATED", entityType: "department", entityId: department.id, afterState: input });
        return department;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Department not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "DEPARTMENT_UPDATED", entityType: "department", entityId: id, beforeState: existing, afterState: updated });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Department not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "DEPARTMENT_DELETED", entityType: "department", entityId: id });
    }
}
exports.DepartmentService = DepartmentService;
//# sourceMappingURL=DepartmentService.js.map