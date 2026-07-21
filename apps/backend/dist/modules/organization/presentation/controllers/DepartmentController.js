"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const DepartmentService_1 = require("../../application/services/DepartmentService");
const MySqlDepartmentRepository_1 = require("../../infrastructure/repositories/MySqlDepartmentRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new DepartmentService_1.DepartmentService(new MySqlDepartmentRepository_1.MySqlDepartmentRepository());
exports.DepartmentController = {
    async list(_req, res) {
        return (0, apiResponse_1.ok)(res, await service.list());
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Department deleted." });
    },
};
//# sourceMappingURL=DepartmentController.js.map