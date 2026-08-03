import { Response } from "express";
import { RoleService } from "../../application/services/RoleService";
import { MySqlRoleRepository } from "../../infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const roleService = new RoleService(new MySqlRoleRepository());

export const RoleController = {
  async listRoles(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await roleService.listRoles());
  },

  async listPermissions(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await roleService.listPermissions());
  },

  async getRolePermissions(req: AuthenticatedRequest, res: Response) {
    return ok(res, await roleService.getRolePermissions(req.params.id));
  },

  async createRole(req: AuthenticatedRequest, res: Response) {
    const role = await roleService.createRole(req.body.name, req.body.description, req.user!.sub);
    return created(res, role);
  },

  async updateRole(req: AuthenticatedRequest, res: Response) {
    const role = await roleService.updateRole(req.params.id, req.body, req.user!.sub);
    return ok(res, role);
  },

  async deleteRole(req: AuthenticatedRequest, res: Response) {
    await roleService.deleteRole(req.params.id, req.user!.sub);
    return ok(res, { message: "Role deleted." });
  },

  async setRolePermissions(req: AuthenticatedRequest, res: Response) {
    const permissions = await roleService.setRolePermissions(req.params.id, req.body.permissionIds, req.user!.sub);
    return ok(res, permissions);
  },

  async assignRoleToUser(req: AuthenticatedRequest, res: Response) {
    const { roleId, scopeType, scopeId } = req.body;
    await roleService.assignRoleToUser(req.params.userId, roleId, scopeType, scopeId, req.user!.sub);
    return ok(res, { message: "Role assigned." });
  },

  async removeRoleFromUser(req: AuthenticatedRequest, res: Response) {
    const { roleId, scopeType, scopeId } = req.body;
    await roleService.removeRoleFromUser(req.params.userId, roleId, scopeType, scopeId, req.user!.sub);
    return ok(res, { message: "Role removed." });
  },

  async getRolesForUser(req: AuthenticatedRequest, res: Response) {
    return ok(res, await roleService.getRolesForUser(req.params.userId));
  },

  async getMyPermissions(req: AuthenticatedRequest, res: Response) {
    const repo = new MySqlRoleRepository();
    const permissions = await repo.getPermissionKeysForUser(req.user!.sub);
    return ok(res, { permissions });
  },
};
