import { v4 as uuid } from "uuid";
import { IContractorRepository } from "../../domain/repositories/IContractorRepository";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { MasterStatus } from "../../domain/entities/FactoryDepartment";

export class ContractorService {
  constructor(private readonly repo: IContractorRepository) {}

  list(status?: MasterStatus) {
    return this.repo.list(status);
  }

  async create(input: { name: string; contactPerson?: string | null; phone?: string | null; email?: string | null }, actorId: string) {
    const contractor = await this.repo.create({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "CONTRACTOR_CREATED", entityType: "contractor", entityId: contractor.id, afterState: input });
    return contractor;
  }

  async update(id: string, changes: { name?: string; contactPerson?: string | null; phone?: string | null; email?: string | null; status?: MasterStatus }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contractor not found.");
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "CONTRACTOR_UPDATED", entityType: "contractor", entityId: id });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contractor not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "CONTRACTOR_DELETED", entityType: "contractor", entityId: id });
  }
}
