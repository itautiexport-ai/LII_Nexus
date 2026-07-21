"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoryProductionEntryController = void 0;
const FactoryProductionEntryService_1 = require("../../application/services/FactoryProductionEntryService");
const MySqlFactoryProductionEntryRepository_1 = require("../../infrastructure/repositories/MySqlFactoryProductionEntryRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new FactoryProductionEntryService_1.FactoryProductionEntryService(new MySqlFactoryProductionEntryRepository_1.MySqlFactoryProductionEntryRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.FactoryProductionEntryController = {
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const factoryDepartmentId = req.query.factoryDepartmentId;
        const status = req.query.status;
        const from = req.query.from;
        const to = req.query.to;
        // "Visible in Reports" only shows approved entries unless the caller
        // explicitly asks for the working queue (e.g. a Production Head
        // reviewing submissions) by passing forWork=true.
        const forWork = req.query.forWork === "true";
        const { items, total } = await service.list({ page, pageSize, factoryDepartmentId, status, from, to }, !forWork);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getById(req.params.id));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        const override = await hasPermission(req.user.sub, "factoryentry.update");
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub, override));
    },
    async approve(req, res) {
        return (0, apiResponse_1.ok)(res, await service.approve(req.params.id, req.user.sub));
    },
    async reject(req, res) {
        return (0, apiResponse_1.ok)(res, await service.reject(req.params.id, req.body.reason, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Production entry deleted." });
    },
    async addFile(req, res) {
        return (0, apiResponse_1.ok)(res, await service.addFile(req.params.id, req.body.kind, req.body.fileName, req.body.fileUrl, req.user.sub));
    },
};
//# sourceMappingURL=FactoryProductionEntryController.js.map