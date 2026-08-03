import { v4 as uuid } from "uuid";
import { IProductionLineRepository } from "../../domain/repositories/IProductionLineRepository";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class ProductionLineService {
  constructor(private readonly repo: IProductionLineRepository) {}

  list() {
    return this.repo.list();
  }

  async create(input: { name: string; code?: string | null; description?: string | null }, actorId: string) {
    const existing = await this.repo.findByName(input.name);
    if (existing) throw new ConflictError("A production line with this name already exists.");
    const line = await this.repo.create({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "PRODUCTION_LINE_CREATED", entityType: "production_line", entityId: line.id, afterState: input });
    return line;
  }

  async update(id: string, changes: { name?: string; code?: string | null; description?: string | null }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production line not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "PRODUCTION_LINE_UPDATED", entityType: "production_line", entityId: id, beforeState: existing, afterState: updated });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production line not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "PRODUCTION_LINE_DELETED", entityType: "production_line", entityId: id });
  }
}
