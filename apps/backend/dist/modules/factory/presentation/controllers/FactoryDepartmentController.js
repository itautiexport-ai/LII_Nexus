"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoryDepartmentController = void 0;
const FactoryDepartmentService_1 = require("../../application/services/FactoryDepartmentService");
const MySqlFactoryDepartmentRepository_1 = require("../../infrastructure/repositories/MySqlFactoryDepartmentRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new FactoryDepartmentService_1.FactoryDepartmentService(new MySqlFactoryDepartmentRepository_1.MySqlFactoryDepartmentRepository());
exports.FactoryDepartmentController = {
    async list(req, res) {
        return (0, apiResponse_1.ok)(res, await service.list(req.query.status));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Factory department deleted." });
    },
};
//# sourceMappingURL=FactoryDepartmentController.js.map