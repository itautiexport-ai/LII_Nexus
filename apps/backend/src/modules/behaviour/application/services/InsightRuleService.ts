import { IBehaviourRepository } from "../../domain/repositories/IBehaviourRepository";
import { InsightRuleKey } from "../../domain/entities/Behaviour";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class InsightRuleService {
  constructor(private readonly repo: IBehaviourRepository) {}

  list() {
    return this.repo.listInsightRules();
  }

  async update(ruleKey: InsightRuleKey, changes: { thresholdValue?: number; enabled?: boolean }, actorId: string) {
    const existing = (await this.repo.listInsightRules()).find((r) => r.ruleKey === ruleKey);
    if (!existing) throw new NotFoundError(`No insight rule found for "${ruleKey}".`);
    const updated = await this.repo.updateInsightRule(ruleKey, changes);
    await AuditService.record({ actorUserId: actorId, action: "INSIGHT_RULE_UPDATED", entityType: "insight_rule", entityId: updated.id, afterState: changes });
    return updated;
  }
}
