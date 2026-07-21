"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class ShiftService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.list();
    }
    async create(input, actorId) {
        const existing = await this.repo.findByName(input.name);
        if (existing)
            throw new DomainError_1.ConflictError("A shift with this name already exists.");
        const shift = await this.repo.create({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "SHIFT_CREATED", entityType: "shift", entityId: shift.id, afterState: input });
        return shift;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Shift not found.");
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "SHIFT_UPDATED", entityType: "shift", entityId: id, beforeState: existing, afterState: updated });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Shift not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "SHIFT_DELETED", entityType: "shift", entityId: id });
    }
}
exports.ShiftService = ShiftService;
//# sourceMappingURL=ShiftService.js.map