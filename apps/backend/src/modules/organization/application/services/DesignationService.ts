import { v4 as uuid } from "uuid";
import { IDesignationRepository } from "../../domain/repositories/IDesignationRepository";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class DesignationService {
  constructor(private readonly repo: IDesignationRepository) {}

  list() {
    return this.repo.list();
  }

  async create(input: { title: string; description?: string | null }, actorId: string) {
    const existing = await this.repo.findByTitle(input.title);
    if (existing) throw new ConflictError("A designation with this title already exists.");
    const designation = await this.repo.create({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "DESIGNATION_CREATED", entityType: "designation", entityId: designation.id, afterState: input });
    return designation;
  }

  async update(id: string, changes: { title?: string; description?: string | null }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Designation not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "DESIGNATION_UPDATED", entityType: "designation", entityId: id, beforeState: existing, afterState: updated });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Designation not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "DESIGNATION_DELETED", entityType: "designation", entityId: id });
  }
}
