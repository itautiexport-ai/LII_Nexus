import { v4 as uuid } from "uuid";
import { IKpiRepository } from "../../domain/repositories/IKpiRepository";
import { CalculationType, KpiCategory, MasterStatus } from "../../domain/entities/Kpi";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class KpiDefinitionService {
  constructor(private readonly repo: IKpiRepository) {}

  list(status?: MasterStatus) {
    return this.repo.listDefinitions(status);
  }

  async getDetail(id: string) {
    const kpi = await this.repo.findDefinitionById(id);
    if (!kpi) throw new NotFoundError("KPI definition not found.");
    const departmentWeightages = await this.repo.getDepartmentWeightages(id);
    return { ...kpi, departmentWeightages };
  }

  async create(input: { name: string; category: KpiCategory; calculationType: CalculationType; defaultWeightage: number; description?: string | null }, actorId: string) {
    const existing = await this.repo.findDefinitionByName(input.name);
    if (existing) throw new ConflictError("A KPI with this name already exists.");
    const kpi = await this.repo.createDefinition({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "KPI_DEFINITION_CREATED", entityType: "kpi_definition", entityId: kpi.id, afterState: input });
    return kpi;
  }

  async update(id: string, changes: { name?: string; defaultWeightage?: number; description?: string | null; status?: MasterStatus }, actorId: string) {
    const existing = await this.repo.findDefinitionById(id);
    if (!existing) throw new NotFoundError("KPI definition not found.");
    const updated = await this.repo.updateDefinition(id, changes);
    await AuditService.record({
      actorUserId: actorId, action: "KPI_DEFINITION_UPDATED", entityType: "kpi_definition", entityId: id,
      beforeState: { defaultWeightage: existing.defaultWeightage, status: existing.status },
      afterState: { defaultWeightage: updated.defaultWeightage, status: updated.status },
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findDefinitionById(id);
    if (!existing) throw new NotFoundError("KPI definition not found.");
    await this.repo.softDeleteDefinition(id);
    await AuditService.record({ actorUserId: actorId, action: "KPI_DEFINITION_DELETED", entityType: "kpi_definition", entityId: id });
  }

  async setDepartmentWeightage(kpiDefinitionId: string, departmentId: string, weightage: number, actorId: string) {
    const kpi = await this.repo.findDefinitionById(kpiDefinitionId);
    if (!kpi) throw new NotFoundError("KPI definition not found.");
    await this.repo.setDepartmentWeightage(kpiDefinitionId, departmentId, weightage);
    await AuditService.record({
      actorUserId: actorId, action: "KPI_DEPARTMENT_WEIGHTAGE_SET", entityType: "kpi_definition", entityId: kpiDefinitionId,
      afterState: { departmentId, weightage },
    });
    return this.repo.getDepartmentWeightages(kpiDefinitionId);
  }

  async removeDepartmentWeightage(kpiDefinitionId: string, departmentId: string, actorId: string) {
    await this.repo.removeDepartmentWeightage(kpiDefinitionId, departmentId);
    await AuditService.record({ actorUserId: actorId, action: "KPI_DEPARTMENT_WEIGHTAGE_REMOVED", entityType: "kpi_definition", entityId: kpiDefinitionId, afterState: { departmentId } });
  }
}
