import { Response } from "express";
import { UserService } from "../../application/services/UserService";
import { MySqlUserRepository } from "../../infrastructure/repositories/MySqlUserRepository";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const userService = new UserService(new MySqlUserRepository(), new MySqlRoleRepository());

export const UserController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const search = req.query.search as string | undefined;
    const result = await userService.list(page, pageSize, search);
    return ok(res, result.items, { page: result.page, pageSize: result.pageSize, totalItems: result.total });
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const user = await userService.getById(req.params.id);
    return ok(res, user);
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const user = await userService.create(req.body, req.user!.sub);
    return created(res, user);
  },

  async update(req: AuthenticatedRequest, res: Response) {
    console.log("UPDATE REQ BODY:", req.body);
    const user = await userService.update(req.params.id, req.body, req.user!.sub);
    return ok(res, user);
  },

  async deactivate(req: AuthenticatedRequest, res: Response) {
    await userService.deactivate(req.params.id, req.user!.sub);
    return ok(res, { message: "User deactivated." });
  },
};
