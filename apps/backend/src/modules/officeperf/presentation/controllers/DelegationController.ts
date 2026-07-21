import { Response } from "express";
import { DelegationService } from "../../application/services/DelegationService";
import { MySqlDelegationRepository } from "../../infrastructure/repositories/MySqlDelegationRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { DelegationBaseStatus } from "../../domain/entities/Delegation";

const service = new DelegationService(new MySqlDelegationRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const DelegationController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const status = req.query.status as DelegationBaseStatus | undefined;
    const override = await hasPermission(req.user!.sub, "delegation.task.view");
    const { items, total } = await service.list(page, pageSize, req.user!.sub, override, status);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async listIDelegated(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.listIDelegated(req.user!.sub));
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.view");
    return ok(res, await service.getById(req.params.id, req.user!.sub, override));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.create");
    return created(res, await service.create(req.body, req.user!.sub, override));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.update");
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub, override));
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.update");
    return ok(res, await service.updateStatus(req.params.id, req.body.status, req.user!.sub, override));
  },

  async escalate(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.update");
    return ok(res, await service.escalate(req.params.id, req.body.escalateTo, req.body.notes, req.user!.sub, override));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.update");
    await service.remove(req.params.id, req.user!.sub, override);
    return ok(res, { message: "Delegated task deleted." });
  },

  async addFile(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "delegation.task.update");
    return ok(res, await service.addFile(req.params.id, req.body.kind, req.body.fileName, req.body.fileUrl, req.user!.sub, override));
  },

  async sendWhatsAppReminder(req: AuthenticatedRequest, res: Response) {
    const result = await service.sendWhatsAppReminder(req.params.id, req.user!.sub);
    return ok(res, result);
  },
};
