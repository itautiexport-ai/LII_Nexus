import { v4 as uuid } from "uuid";
import { CreateEntryData, IFactoryProductionEntryRepository, ListEntriesParams, UpdateEntryData } from "../../domain/repositories/IFactoryProductionEntryRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { EntryFileKind } from "../../domain/entities/FactoryProductionEntry";

export class FactoryProductionEntryService {
  constructor(
    private readonly repo: IFactoryProductionEntryRepository,
    private readonly scope: EmployeeScopeService
  ) {}

  /** Reports only ever show approved entries - unapproved work-in-progress
   *  submissions should never leak into management reporting, per the
   *  "Approved -> Visible in Reports" requirement. Callers that need the
   *  working queue (supervisors/production heads reviewing) pass their own
   *  status filter instead of relying on this default. */
  async list(params: ListEntriesParams, forReportsOnly: boolean) {
    return this.repo.list(forReportsOnly ? { ...params, status: "approved" } : params);
  }

  async getById(id: string) {
    const entry = await this.repo.getWithContext(id);
    if (!entry) throw new NotFoundError("Production entry not found.");
    return entry;
  }

  async create(input: Omit<CreateEntryData, "id" | "submittedBy">, actorId: string) {


    // submitted_by is a foreign key to employees, not users - resolve the
    // acting user's own employee record rather than passing the user id
    // straight through (that FK mismatch caused a 500 the first time this
    // was tested against a real database).
    const actorEmployee = await this.scope.requireEmployeeForUser(actorId);

    const entry = await this.repo.create({ id: uuid(), submittedBy: actorEmployee.id, ...input });
    await AuditService.record({
      actorUserId: actorId,
      action: "FACTORY_ENTRY_SUBMITTED",
      entityType: "factory_production_entry",
      entityId: entry.id,
      afterState: { entryDate: entry.entryDate, method: entry.productionMethod },
    });
    return entry;
  }

  async update(id: string, changes: UpdateEntryData, actorId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production entry not found.");
    if (existing.status !== "submitted") {
      throw new ConflictError("Only entries still awaiting approval can be edited. This entry has already been reviewed.");
    }
    if (!hasUpdateOverride) {
      const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
      if (existing.submittedBy !== actorEmployee.id) {
        throw new ForbiddenError("Only the supervisor who submitted this entry can edit it before it's reviewed.");
      }
    }

    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_UPDATED", entityType: "factory_production_entry", entityId: id });
    return updated;
  }

  async approve(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production entry not found.");
    if (existing.status !== "submitted") {
      throw new ConflictError(`This entry is already ${existing.status} and cannot be re-approved.`);
    }
    const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
    const updated = await this.repo.approve(id, actorEmployee.id);
    await AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_APPROVED", entityType: "factory_production_entry", entityId: id });
    return updated;
  }

  async reject(id: string, reason: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production entry not found.");
    if (existing.status !== "submitted") {
      throw new ConflictError(`This entry is already ${existing.status} and cannot be rejected.`);
    }
    const actorEmployee = await this.scope.requireEmployeeForUser(actorId);
    const updated = await this.repo.reject(id, actorEmployee.id, reason);
    await AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_REJECTED", entityType: "factory_production_entry", entityId: id, afterState: { reason } });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production entry not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_DELETED", entityType: "factory_production_entry", entityId: id });
  }

  async addFile(id: string, kind: EntryFileKind, fileName: string, fileUrl: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Production entry not found.");
    await this.repo.addFile(id, kind, fileName, fileUrl, actorId);
    await AuditService.record({ actorUserId: actorId, action: "FACTORY_ENTRY_FILE_ADDED", entityType: "factory_production_entry", entityId: id, afterState: { kind, fileName } });
    return this.repo.getWithContext(id);
  }
}
