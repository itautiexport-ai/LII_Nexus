"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const EmployeeService_1 = require("../../application/services/EmployeeService");
const MySqlEmployeeRepository_1 = require("../../infrastructure/repositories/MySqlEmployeeRepository");
const MySqlDepartmentRepository_1 = require("../../infrastructure/repositories/MySqlDepartmentRepository");
const MySqlDesignationRepository_1 = require("../../infrastructure/repositories/MySqlDesignationRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const service = new EmployeeService_1.EmployeeService(new MySqlEmployeeRepository_1.MySqlEmployeeRepository(), new MySqlDepartmentRepository_1.MySqlDepartmentRepository(), new MySqlDesignationRepository_1.MySqlDesignationRepository());
exports.EmployeeController = {
    async me(req, res) {
        const repo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
        const employee = await repo.findByUserId(req.user.sub);
        return (0, apiResponse_1.ok)(res, employee);
    },
    async myDirectReports(req, res) {
        const repo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
        const me = await repo.findByUserId(req.user.sub);
        if (!me)
            return (0, apiResponse_1.ok)(res, []);
        return (0, apiResponse_1.ok)(res, await repo.listDirectReports(me.id));
    },
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const search = req.query.search;
        const departmentId = req.query.departmentId;
        const { items, total } = await service.list(page, pageSize, search, departmentId);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        return (0, apiResponse_1.ok)(res, await service.getById(req.params.id));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await service.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await service.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await service.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Employee deactivated." });
    },
};
//# sourceMappingURL=EmployeeController.js.map