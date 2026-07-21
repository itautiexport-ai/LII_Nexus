"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviourComponentService = void 0;
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class BehaviourComponentService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.listComponents();
    }
    async update(id, changes, actorId) {
        const existing = (await this.repo.listComponents()).find((c) => c.id === id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Behaviour component not found.");
        const updated = await this.repo.updateComponent(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "BEHAVIOUR_COMPONENT_UPDATED", entityType: "behaviour_component", entityId: id, afterState: changes });
        return updated;
    }
}
exports.BehaviourComponentService = BehaviourComponentService;
//# sourceMappingURL=BehaviourComponentService.js.map