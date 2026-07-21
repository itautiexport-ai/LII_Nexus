"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const RoleService_1 = require("../../application/services/RoleService");
const MySqlRoleRepository_1 = require("../../infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const roleService = new RoleService_1.RoleService(new MySqlRoleRepository_1.MySqlRoleRepository());
exports.RoleController = {
    async listRoles(_req, res) {
        return (0, apiResponse_1.ok)(res, await roleService.listRoles());
    },
    async listPermissions(_req, res) {
        return (0, apiResponse_1.ok)(res, await roleService.listPermissions());
    },
    async getRolePermissions(req, res) {
        return (0, apiResponse_1.ok)(res, await roleService.getRolePermissions(req.params.id));
    },
    async createRole(req, res) {
        const role = await roleService.createRole(req.body.name, req.body.description, req.user.sub);
        return (0, apiResponse_1.created)(res, role);
    },
    async updateRole(req, res) {
        const role = await roleService.updateRole(req.params.id, req.body, req.user.sub);
        return (0, apiResponse_1.ok)(res, role);
    },
    async deleteRole(req, res) {
        await roleService.deleteRole(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Role deleted." });
    },
    async setRolePermissions(req, res) {
        const permissions = await roleService.setRolePermissions(req.params.id, req.body.permissionIds, req.user.sub);
        return (0, apiResponse_1.ok)(res, permissions);
    },
    async assignRoleToUser(req, res) {
        const { roleId, scopeType, scopeId } = req.body;
        await roleService.assignRoleToUser(req.params.userId, roleId, scopeType, scopeId, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Role assigned." });
    },
    async removeRoleFromUser(req, res) {
        const { roleId, scopeType, scopeId } = req.body;
        await roleService.removeRoleFromUser(req.params.userId, roleId, scopeType, scopeId, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Role removed." });
    },
    async getRolesForUser(req, res) {
        return (0, apiResponse_1.ok)(res, await roleService.getRolesForUser(req.params.userId));
    },
    async getMyPermissions(req, res) {
        const repo = new MySqlRoleRepository_1.MySqlRoleRepository();
        const permissions = await repo.getPermissionKeysForUser(req.user.sub);
        return (0, apiResponse_1.ok)(res, { permissions });
    },
};
//# sourceMappingURL=RoleController.js.map