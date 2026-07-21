"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiDefinitionService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class KpiDefinitionService {
    constructor(repo) {
        this.repo = repo;
    }
    list(status) {
        return this.repo.listDefinitions(status);
    }
    async getDetail(id) {
        const kpi = await this.repo.findDefinitionById(id);
        if (!kpi)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        const departmentWeightages = await this.repo.getDepartmentWeightages(id);
        return { ...kpi, departmentWeightages };
    }
    async create(input, actorId) {
        const existing = await this.repo.findDefinitionByName(input.name);
        if (existing)
            throw new DomainError_1.ConflictError("A KPI with this name already exists.");
        const kpi = await this.repo.createDefinition({ id: (0, uuid_1.v4)(), ...input });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "KPI_DEFINITION_CREATED", entityType: "kpi_definition", entityId: kpi.id, afterState: input });
        return kpi;
    }
    async update(id, changes, actorId) {
        const existing = await this.repo.findDefinitionById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        const updated = await this.repo.updateDefinition(id, changes);
        await AuditService_1.AuditService.record({
            actorUserId: actorId, action: "KPI_DEFINITION_UPDATED", entityType: "kpi_definition", entityId: id,
            beforeState: { defaultWeightage: existing.defaultWeightage, status: existing.status },
            afterState: { defaultWeightage: updated.defaultWeightage, status: updated.status },
        });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findDefinitionById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        await this.repo.softDeleteDefinition(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "KPI_DEFINITION_DELETED", entityType: "kpi_definition", entityId: id });
    }
    async setDepartmentWeightage(kpiDefinitionId, departmentId, weightage, actorId) {
        const kpi = await this.repo.findDefinitionById(kpiDefinitionId);
        if (!kpi)
            throw new DomainError_1.NotFoundError("KPI definition not found.");
        await this.repo.setDepartmentWeightage(kpiDefinitionId, departmentId, weightage);
        await AuditService_1.AuditService.record({
            actorUserId: actorId, action: "KPI_DEPARTMENT_WEIGHTAGE_SET", entityType: "kpi_definition", entityId: kpiDefinitionId,
            afterState: { departmentId, weightage },
        });
        return this.repo.getDepartmentWeightages(kpiDefinitionId);
    }
    async removeDepartmentWeightage(kpiDefinitionId, departmentId, actorId) {
        await this.repo.removeDepartmentWeightage(kpiDefinitionId, departmentId);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "KPI_DEPARTMENT_WEIGHTAGE_REMOVED", entityType: "kpi_definition", entityId: kpiDefinitionId, afterState: { departmentId } });
    }
}
exports.KpiDefinitionService = KpiDefinitionService;
//# sourceMappingURL=KpiDefinitionService.js.map