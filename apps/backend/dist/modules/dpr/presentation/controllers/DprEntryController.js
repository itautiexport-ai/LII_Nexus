"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DprEntryController = void 0;
const DprEntryService_1 = require("../../application/services/DprEntryService");
const MySqlDprEntryRepository_1 = require("../../infrastructure/repositories/MySqlDprEntryRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new DprEntryService_1.DprEntryService(new MySqlDprEntryRepository_1.MySqlDprEntryRepository(), new EmployeeScopeService_1.EmployeeScopeService());
exports.DprEntryController = {
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "50", 10);
        const entryDate = req.query.entryDate;
        const factoryDepartmentId = req.query.factoryDepartmentId;
        const { items, total } = await service.list({ page, pageSize, entryDate, factoryDepartmentId });
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getById(req.params.id));
    },
    async create(req, res) {
        console.log("Create DPR payload:", JSON.stringify(req.body, null, 2));
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "DPR entry deleted." });
    },
};
//# sourceMappingURL=DprEntryController.js.map