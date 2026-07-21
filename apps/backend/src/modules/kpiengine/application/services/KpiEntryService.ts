import { v4 as uuid } from "uuid";
import { IKpiEngineRepository } from "../../domain/repositories/IKpiEngineRepository";
import { KpiFormulaEvaluator } from "./KpiFormulaEvaluator";
import { TrafficLight } from "../../domain/entities/KpiEngine";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { currentPeriodKey } from "./kpiPeriodUtils";

function trafficLightFor(score: number, greenThreshold: number, amberThreshold: number): TrafficLight {
  if (score >= greenThreshold) return "green";
  if (score >= amberThreshold) return "amber";
  return "red";
}

export class KpiEntryService {
  constructor(private readonly repo: IKpiEngineRepository, private readonly scope: EmployeeScopeService) {}

  async recordEntry(kpiDefinitionId: string, periodKey: string | undefined, target: number, actual: number, actorUserId: string) {
    const definition = await this.repo.findDefinitionById(kpiDefinitionId);
    if (!definition) throw new NotFoundError("KPI definition not found.");

    const effectivePeriodKey = periodKey ?? currentPeriodKey(definition.frequency);
    // Re-validated at evaluation time too, not just at definition-save time -
    // defense in depth, since a formula could in principle have been edited
    // between validation and use (it can't be, actually, since update()
    // re-validates - but evaluating defensively costs nothing and protects
    // against any future code path that writes a formula without going
    // through the service).
    const rawScore = KpiFormulaEvaluator.evaluate(definition.formula, target, actual);
    const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
    const trafficLight = trafficLightFor(clampedScore, definition.greenThreshold, definition.amberThreshold);

    const enteredByEmployee = await this.scope.getEmployeeForUser(actorUserId);
    const entry = await this.repo.upsertEntry({
      id: uuid(), kpiDefinitionId, periodKey: effectivePeriodKey, target, actual,
      computedScore: clampedScore, trafficLight, weightageUsed: definition.weightage, enteredBy: enteredByEmployee?.id ?? null,
    });

    await AuditService.record({
      actorUserId, action: "KPI_ENGINE_ENTRY_RECORDED", entityType: "kpi_engine_entry", entityId: entry.id,
      afterState: { kpiDefinitionId, periodKey: effectivePeriodKey, target, actual, computedScore: clampedScore, trafficLight },
    });
    return entry;
  }

  getHistory(kpiDefinitionId: string, periodKeys?: string[]) {
    return this.repo.listEntriesForDefinition(kpiDefinitionId, periodKeys);
  }
}
