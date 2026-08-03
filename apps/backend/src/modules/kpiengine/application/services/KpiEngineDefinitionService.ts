import { v4 as uuid } from "uuid";
import { IKpiEngineRepository } from "../../domain/repositories/IKpiEngineRepository";
import { KpiCategory, KpiFrequency, MasterStatus } from "../../domain/entities/KpiEngine";
import { KpiFormulaEvaluator } from "./KpiFormulaEvaluator";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class KpiEngineDefinitionService {
  constructor(private readonly repo: IKpiEngineRepository) {}

  list(params: { category?: KpiCategory; departmentId?: string; responsibleEmployeeId?: string; status?: MasterStatus }) {
    return this.repo.listDefinitions(params);
  }

  async getById(id: string) {
    const def = await this.repo.findDefinitionById(id);
    if (!def) throw new NotFoundError("KPI definition not found.");
    return def;
  }

  /** This is the "admin creates KPIs without coding" moment: the formula is
   *  validated against a strict whitelist and test-evaluated here, before
   *  it's ever stored - a bad formula is rejected immediately with a clear
   *  reason, not discovered later when someone tries to use it. */
  async create(input: { name: string; category: KpiCategory; formula: string; weightage: number; frequency: KpiFrequency; responsibleEmployeeId?: string | null; departmentId?: string | null; greenThreshold?: number; amberThreshold?: number }, actorId: string) {
    KpiFormulaEvaluator.validate(input.formula);
    const def = await this.repo.createDefinition({ id: uuid(), ...input });
    await AuditService.record({ actorUserId: actorId, action: "KPI_ENGINE_DEFINITION_CREATED", entityType: "kpi_engine_definition", entityId: def.id, afterState: { name: def.name, formula: def.formula, category: def.category } });
    return def;
  }

  async update(id: string, changes: Partial<{ name: string; formula: string; weightage: number; frequency: KpiFrequency; responsibleEmployeeId: string | null; departmentId: string | null; greenThreshold: number; amberThreshold: number; status: MasterStatus }>, actorId: string) {
    const existing = await this.repo.findDefinitionById(id);
    if (!existing) throw new NotFoundError("KPI definition not found.");
    if (changes.formula !== undefined) KpiFormulaEvaluator.validate(changes.formula);
    const updated = await this.repo.updateDefinition(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "KPI_ENGINE_DEFINITION_UPDATED", entityType: "kpi_engine_definition", entityId: id, afterState: changes });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findDefinitionById(id);
    if (!existing) throw new NotFoundError("KPI definition not found.");
    await this.repo.softDeleteDefinition(id);
    await AuditService.record({ actorUserId: actorId, action: "KPI_ENGINE_DEFINITION_DELETED", entityType: "kpi_engine_definition", entityId: id });
  }
}
