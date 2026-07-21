"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightRuleService = void 0;
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class InsightRuleService {
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.listInsightRules();
    }
    async update(ruleKey, changes, actorId) {
        const existing = (await this.repo.listInsightRules()).find((r) => r.ruleKey === ruleKey);
        if (!existing)
            throw new DomainError_1.NotFoundError(`No insight rule found for "${ruleKey}".`);
        const updated = await this.repo.updateInsightRule(ruleKey, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "INSIGHT_RULE_UPDATED", entityType: "insight_rule", entityId: updated.id, afterState: changes });
        return updated;
    }
}
exports.InsightRuleService = InsightRuleService;
//# sourceMappingURL=InsightRuleService.js.map