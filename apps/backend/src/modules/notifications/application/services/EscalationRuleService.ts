import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class EscalationRuleService {
  constructor(private readonly repo: INotificationRepository) {}

  list() {
    return this.repo.listEscalationRules();
  }

  async update(level: number, changes: { targetRoleId?: string | null; escalateAfterHours?: number }, actorId: string) {
    const existing = await this.repo.listEscalationRules();
    if (!existing.some((r) => r.level === level)) throw new NotFoundError(`No escalation rule exists for level ${level}.`);
    const updated = await this.repo.updateEscalationRule(level, changes);
    await AuditService.record({ actorUserId: actorId, action: "ESCALATION_RULE_UPDATED", entityType: "escalation_rule", entityId: updated.id, afterState: { level, ...changes } });
    return updated;
  }
}
