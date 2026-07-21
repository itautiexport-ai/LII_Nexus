import { v4 as uuid } from "uuid";
import { IShiftRepository } from "../../domain/repositories/IShiftRepository";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class ShiftService {
  constructor(private readonly repo: IShiftRepository) {}

  list() {
    return this.repo.list();
  }

  async create(input: { name: string; startTime?: string | null; endTime?: string | null }, actorId: string) {
    const existing = await this.repo.findByName(input.name);
    if (existing) throw new ConflictError("A shift with this name already exists.");
    const shift = await this.repo.create({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "SHIFT_CREATED", entityType: "shift", entityId: shift.id, afterState: input });
    return shift;
  }

  async update(id: string, changes: { name?: string; startTime?: string | null; endTime?: string | null }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Shift not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "SHIFT_UPDATED", entityType: "shift", entityId: id, beforeState: existing, afterState: updated });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Shift not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "SHIFT_DELETED", entityType: "shift", entityId: id });
  }
}
