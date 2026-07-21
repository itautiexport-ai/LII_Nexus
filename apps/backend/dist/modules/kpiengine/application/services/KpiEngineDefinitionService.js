"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiEngineDefinitionService = void 0;
const uuid_1 = require("uuid");
const KpiFormulaEvaluator_1 = require("./KpiFormulaEvaluator");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class KpiEngineDefinitionService {
    constructor(repo) {
        this.repo = repo;
    }
    list(params) {
        return this.repo.listDefinitions(params);
    }
    async getById(id) {
        const def = await this.repo.findDefinitionById(id);
        if (!def)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        return def;
    }
    /** This is the "admin creates KPIs without coding" moment: the formula is
     *  validated against a strict whitelist and test-evaluated here, before
     *  it's ever stored - a bad formula is rejected immediately with a clear
     *  reason, not discovered later when someone tries to use it. */
    async create(input, actorId) {
        KpiFormulaEvaluator_1.KpiFormulaEvaluator.validate(input.formula);
        const def = await this.repo.createDefinition({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "KPI_ENGINE_DEFINITION_CREATED", entityType: "kpi_engine_definition", entityId: def.id, afterState: { name: def.name, formula: def.formula, category: def.category } });
        return def;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findDefinitionById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        if (changes.formula !== undefined)
            KpiFormulaEvaluator_1.KpiFormulaEvaluator.validate(changes.formula);
        const updated = await this.repo.updateDefinition(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "KPI_ENGINE_DEFINITION_UPDATED", entityType: "kpi_engine_definition", entityId: id, afterState: changes });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findDefinitionById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        await this.repo.softDeleteDefinition(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "KPI_ENGINE_DEFINITION_DELETED", entityType: "kpi_engine_definition", entityId: id });
    }
}
exports.KpiEngineDefinitionService = KpiEngineDefinitionService;
//# sourceMappingURL=KpiEngineDefinitionService.js.map