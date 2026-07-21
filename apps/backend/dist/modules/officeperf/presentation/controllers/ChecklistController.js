"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChecklistController = void 0;
const ChecklistService_1 = require("../../application/services/ChecklistService");
const MySqlChecklistRepository_1 = require("../../infrastructure/repositories/MySqlChecklistRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new ChecklistService_1.ChecklistService(new MySqlChecklistRepository_1.MySqlChecklistRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.ChecklistController = {
    async listTemplates(req, res) {
        const search = req.query.search;
        const frequency = req.query.frequency;
        const status = req.query.status;
        return (0, apiResponse_1.ok)(res, await service.listTemplates(search, frequency, status));
    },
    async getTemplateDetail(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getTemplateDetail(req.params.id));
    },
    async createTemplate(req, res) {
        return (0, apiResponse_1.created)(res, await service.createTemplate(req.body, req.user.sub));
    },
    async updateTemplate(req, res) {
        return (0, apiResponse_1.ok)(res, await service.updateTemplate(req.params.id, req.body, req.user.sub));
    },
    async deleteTemplate(req, res) {
        await service.deleteTemplate(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Checklist template deleted." });
    },
    async getMyChecklists(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getMyChecklists(req.user.sub));
    },
    async setItemChecked(req, res) {
        const override = await hasPermission(req.user.sub, "checklist.instance.view");
        return (0, apiResponse_1.ok)(res, await service.setItemChecked(req.params.instanceId, req.params.itemId, req.body.checked, req.user.sub, override));
    },
};
//# sourceMappingURL=ChecklistController.js.map