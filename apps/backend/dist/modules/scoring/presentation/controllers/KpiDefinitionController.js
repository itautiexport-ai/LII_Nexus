"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiDefinitionController = void 0;
const KpiDefinitionService_1 = require("../../application/services/KpiDefinitionService");
const MySqlKpiRepository_1 = require("../../infrastructure/repositories/MySqlKpiRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new KpiDefinitionService_1.KpiDefinitionService(new MySqlKpiRepository_1.MySqlKpiRepository());
exports.KpiDefinitionController = {
    async list(req, res) {
        return (0, apiResponse_1.ok)(res, await service.list(req.query.status));
    },
    async getDetail(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getDetail(req.params.id));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "KPI definition deleted." });
    },
    async setDepartmentWeightage(req, res) {
        return (0, apiResponse_1.ok)(res, await service.setDepartmentWeightage(req.params.id, req.body.departmentId, req.body.weightage, req.user.sub));
    },
    async removeDepartmentWeightage(req, res) {
        await service.removeDepartmentWeightage(req.params.id, req.params.departmentId, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Department weightage override removed." });
    },
};
//# sourceMappingURL=KpiDefinitionController.js.map