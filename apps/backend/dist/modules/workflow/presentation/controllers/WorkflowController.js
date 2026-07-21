"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const WorkflowService_1 = require("../../application/services/WorkflowService");
const MySqlWorkflowRepository_1 = require("../../infrastructure/repositories/MySqlWorkflowRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new WorkflowService_1.WorkflowService(new MySqlWorkflowRepository_1.MySqlWorkflowRepository());
exports.WorkflowController = {
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const search = req.query.search;
        const departmentId = req.query.departmentId;
        const status = req.query.status;
        const { items, total } = await service.list(page, pageSize, search, departmentId, status);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getById(req.params.id));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async updateMeta(req, res) {
        return (0, apiResponse_1.ok)(res, await service.updateMeta(req.params.id, req.body, req.user.sub));
    },
    async updateStatus(req, res) {
        return (0, apiResponse_1.ok)(res, await service.updateStatus(req.params.id, req.body.status, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Workflow deleted." });
    },
    async addStage(req, res) {
        return (0, apiResponse_1.created)(res, await service.addStage(req.params.id, req.body, req.user.sub));
    },
    async updateStage(req, res) {
        return (0, apiResponse_1.ok)(res, await service.updateStage(req.params.id, req.params.stageId, req.body, req.user.sub));
    },
    async removeStage(req, res) {
        await service.removeStage(req.params.id, req.params.stageId, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Stage removed." });
    },
    async reorderStages(req, res) {
        return (0, apiResponse_1.ok)(res, await service.reorderStages(req.params.id, req.body.stageIds, req.user.sub));
    },
};
//# sourceMappingURL=WorkflowController.js.map