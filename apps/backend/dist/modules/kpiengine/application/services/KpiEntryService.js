"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiEntryService = void 0;
const uuid_1 = require("uuid");
const KpiFormulaEvaluator_1 = require("./KpiFormulaEvaluator");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const kpiPeriodUtils_1 = require("./kpiPeriodUtils");
function trafficLightFor(score, greenThreshold, amberThreshold) {
    if (score >= greenThreshold)
        return "green";
    if (score >= amberThreshold)
        return "amber";
    return "red";
}
class KpiEntryService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async recordEntry(kpiDefinitionId, periodKey, target, actual, actorUserId) {
        const definition = await this.repo.findDefinitionById(kpiDefinitionId);
        if (!definition)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        const effectivePeriodKey = periodKey ?? (0, kpiPeriodUtils_1.currentPeriodKey)(definition.frequency);
        // Re-validated at evaluation time too, not just at definition-save time -
        // defense in depth, since a formula could in principle have been edited
        // between validation and use (it can't be, actually, since update()
        // re-validates - but evaluating defensively costs nothing and protects
        // against any future code path that writes a formula without going
        // through the service).
        const rawScore = KpiFormulaEvaluator_1.KpiFormulaEvaluator.evaluate(definition.formula, target, actual);
        const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
        const trafficLight = trafficLightFor(clampedScore, definition.greenThreshold, definition.amberThreshold);
        const enteredByEmployee = await this.scope.getEmployeeForUser(actorUserId);
        const entry = await this.repo.upsertEntry({
            id: (0, uuid_1.v4)(), kpiDefinitionId, periodKey: effectivePeriodKey, target, actual,
            computedScore: clampedScore, trafficLight, weightageUsed: definition.weightage, enteredBy: enteredByEmployee?.id ?? null,
        });
        await AuditService_1.AuditService.record({
            actorUserId, action: "KPI_ENGINE_ENTRY_RECORDED", entityType: "kpi_engine_entry", entityId: entry.id,
            afterState: { kpiDefinitionId, periodKey: effectivePeriodKey, target, actual, computedScore: clampedScore, trafficLight },
        });
        return entry;
    }
    getHistory(kpiDefinitionId, periodKeys) {
        return this.repo.listEntriesForDefinition(kpiDefinitionId, periodKeys);
    }
}
exports.KpiEntryService = KpiEntryService;
//# sourceMappingURL=KpiEntryService.js.map