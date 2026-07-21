"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationController = void 0;
const DelegationService_1 = require("../../application/services/DelegationService");
const MySqlDelegationRepository_1 = require("../../infrastructure/repositories/MySqlDelegationRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new DelegationService_1.DelegationService(new MySqlDelegationRepository_1.MySqlDelegationRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.DelegationController = {
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const status = req.query.status;
        const override = await hasPermission(req.user.sub, "delegation.task.view");
        const { items, total } = await service.list(page, pageSize, req.user.sub, override, status);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async listIDelegated(req, res) {
        return (0, apiResponse_1.ok)(res, await service.listIDelegated(req.user.sub));
    },
    async getById(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.view");
        return (0, apiResponse_1.ok)(res, await service.getById(req.params.id, req.user.sub, override));
    },
    async create(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.create");
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub, override));
    },
    async update(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.update");
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub, override));
    },
    async updateStatus(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.update");
        return (0, apiResponse_1.ok)(res, await service.updateStatus(req.params.id, req.body.status, req.user.sub, override));
    },
    async escalate(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.update");
        return (0, apiResponse_1.ok)(res, await service.escalate(req.params.id, req.body.escalateTo, req.body.notes, req.user.sub, override));
    },
    async remove(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.update");
        await service.remove(req.params.id, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, { message: "Delegated task deleted." });
    },
    async addFile(req, res) {
        const override = await hasPermission(req.user.sub, "delegation.task.update");
        return (0, apiResponse_1.ok)(res, await service.addFile(req.params.id, req.body.kind, req.body.fileName, req.body.fileUrl, req.user.sub, override));
    },
    async sendWhatsAppReminder(req, res) {
        const result = await service.sendWhatsAppReminder(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, result);
    },
};
//# sourceMappingURL=DelegationController.js.map