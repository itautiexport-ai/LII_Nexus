"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowchartController = void 0;
const FlowchartService_1 = require("../../application/services/FlowchartService");
const MySqlFlowchartRepository_1 = require("../../infrastructure/repositories/MySqlFlowchartRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new FlowchartService_1.FlowchartService(new MySqlFlowchartRepository_1.MySqlFlowchartRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.FlowchartController = {
    async startRun(req, res) {
        const run = await service.startRun(req.body.workflowId, req.body.reference, req.body.notes, req.user.sub);
        return (0, apiResponse_1.created)(res, run);
    },
    async listRuns(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const workflowId = req.query.workflowId;
        const status = req.query.status;
        const { items, total } = await service.listRuns(page, pageSize, workflowId, status);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getRunDetail(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getRunDetail(req.params.id));
    },
    async listMyTasks(req, res) {
        const { from, to } = req.query;
        return (0, apiResponse_1.ok)(res, await service.listMyTasks(req.user.sub, from, to));
    },
    async assignTask(req, res) {
        const override = await hasPermission(req.user.sub, "flowchart.task.assign");
        return (0, apiResponse_1.ok)(res, await service.assignTask(req.params.taskId, req.body.employeeId, req.user.sub, override));
    },
    async updateTaskStatus(req, res) {
        const override = await hasPermission(req.user.sub, "flowchart.task.update");
        return (0, apiResponse_1.ok)(res, await service.updateTaskStatus(req.params.taskId, req.body.status, req.body.remarks, req.user.sub, override));
    },
};
//# sourceMappingURL=FlowchartController.js.map