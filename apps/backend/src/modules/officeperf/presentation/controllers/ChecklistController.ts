import { Response } from "express";
import { ChecklistService } from "../../application/services/ChecklistService";
import { MySqlChecklistRepository } from "../../infrastructure/repositories/MySqlChecklistRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { ChecklistFrequency, MasterStatus } from "../../domain/entities/Checklist";

const service = new ChecklistService(new MySqlChecklistRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const ChecklistController = {
  async listTemplates(req: AuthenticatedRequest, res: Response) {
    const search = req.query.search as string | undefined;
    const frequency = req.query.frequency as ChecklistFrequency | undefined;
    const status = req.query.status as MasterStatus | undefined;
    return ok(res, await service.listTemplates(search, frequency, status));
  },

  async getTemplateDetail(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getTemplateDetail(req.params.id));
  },

  async createTemplate(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.createTemplate(req.body, req.user!.sub));
  },

  async updateTemplate(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.updateTemplate(req.params.id, req.body, req.user!.sub));
  },

  async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    await service.deleteTemplate(req.params.id, req.user!.sub);
    return ok(res, { message: "Checklist template deleted." });
  },

  async getMyChecklists(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getMyChecklists(req.user!.sub));
  },

  async setItemChecked(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "checklist.instance.view");
    return ok(res, await service.setItemChecked(req.params.instanceId, req.params.itemId, req.body.checked, req.user!.sub, override));
  },
};
