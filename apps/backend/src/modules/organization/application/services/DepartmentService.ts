import { v4 as uuid } from "uuid";
import { IDepartmentRepository } from "../../domain/repositories/IDepartmentRepository";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class DepartmentService {
  constructor(private readonly repo: IDepartmentRepository) {}

  list() {
    return this.repo.list();
  }

  async create(input: { name: string; code?: string | null; description?: string | null }, actorId: string) {
    const existing = await this.repo.findByName(input.name);
    if (existing) throw new ConflictError("A department with this name already exists.");
    const department = await this.repo.create({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "DEPARTMENT_CREATED", entityType: "department", entityId: department.id, afterState: input });
    return department;
  }

  async update(id: string, changes: { name?: string; code?: string | null; description?: string | null }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Department not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "DEPARTMENT_UPDATED", entityType: "department", entityId: id, beforeState: existing, afterState: updated });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Department not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "DEPARTMENT_DELETED", entityType: "department", entityId: id });
  }
}
