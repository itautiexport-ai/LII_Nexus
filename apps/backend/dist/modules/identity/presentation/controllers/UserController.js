"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../../application/services/UserService");
const MySqlUserRepository_1 = require("../../infrastructure/repositories/MySqlUserRepository");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const userService = new UserService_1.UserService(new MySqlUserRepository_1.MySqlUserRepository(), new MySqlRoleRepository_1.MySqlRoleRepository());
exports.UserController = {
    async list(req, res) {
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const search = req.query.search;
        const result = await userService.list(page, pageSize, search);
        return (0, apiResponse_1.ok)(res, result.items, { page: result.page, pageSize: result.pageSize, totalItems: result.total });
    },
    async getById(req, res) {
        const user = await userService.getById(req.params.id);
        return (0, apiResponse_1.ok)(res, user);
    },
    async create(req, res) {
        const user = await userService.create(req.body, req.user.sub);
        return (0, apiResponse_1.created)(res, user);
    },
    async update(req, res) {
        console.log("UPDATE REQ BODY:", req.body);
        const user = await userService.update(req.params.id, req.body, req.user.sub);
        return (0, apiResponse_1.ok)(res, user);
    },
    async deactivate(req, res) {
        await userService.deactivate(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "User deactivated." });
    },
};
//# sourceMappingURL=UserController.js.map