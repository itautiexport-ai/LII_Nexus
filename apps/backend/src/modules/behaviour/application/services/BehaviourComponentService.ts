import { IBehaviourRepository } from "../../domain/repositories/IBehaviourRepository";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class BehaviourComponentService {
  constructor(private readonly repo: IBehaviourRepository) {}

  list() {
    return this.repo.listComponents();
  }

  async update(id: string, changes: { weight?: number; status?: "active" | "inactive" }, actorId: string) {
    const existing = (await this.repo.listComponents()).find((c) => c.id === id);
    if (!existing) throw new NotFoundError("Behaviour component not found.");
    const updated = await this.repo.updateComponent(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "BEHAVIOUR_COMPONENT_UPDATED", entityType: "behaviour_component", entityId: id, afterState: changes });
    return updated;
  }
}
