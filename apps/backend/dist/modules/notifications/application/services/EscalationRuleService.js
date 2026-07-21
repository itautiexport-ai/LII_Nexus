"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationRuleService = void 0;
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class EscalationRuleService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.listEscalationRules();
    }
    async update(level, changes, actorId) {
        const existing = await this.repo.listEscalationRules();
        if (!existing.some((r) => r.level === level))
            throw new DomainError_1.NotFoundError(`No escalation rule exists for level ${level}.`);
        const updated = await this.repo.updateEscalationRule(level, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "ESCALATION_RULE_UPDATED", entityType: "escalation_rule", entityId: updated.id, afterState: { level, ...changes } });
        return updated;
    }
}
exports.EscalationRuleService = EscalationRuleService;
//# sourceMappingURL=EscalationRuleService.js.map