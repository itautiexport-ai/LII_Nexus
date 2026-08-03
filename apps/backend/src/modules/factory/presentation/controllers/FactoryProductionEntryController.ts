import { Response } from "express";
import { FactoryProductionEntryService } from "../../application/services/FactoryProductionEntryService";
import { MySqlFactoryProductionEntryRepository } from "../../infrastructure/repositories/MySqlFactoryProductionEntryRepository";

import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { EntryApprovalStatus } from "../../domain/entities/FactoryProductionEntry";

const service = new FactoryProductionEntryService(new MySqlFactoryProductionEntryRepository(), new EmployeeScopeService());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const FactoryProductionEntryController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const factoryDepartmentId = req.query.factoryDepartmentId as string | undefined;
    const status = req.query.status as EntryApprovalStatus | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    // "Visible in Reports" only shows approved entries unless the caller
    // explicitly asks for the working queue (e.g. a Production Head
    // reviewing submissions) by passing forWork=true.
    const forWork = req.query.forWork === "true";
    const { items, total } = await service.list({ page, pageSize, factoryDepartmentId, status, from, to }, !forWork);
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getById(req.params.id));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.create(req.body, req.user!.sub));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "factoryentry.update");
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub, override));
  },

  async approve(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.approve(req.params.id, req.user!.sub));
  },

  async reject(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.reject(req.params.id, req.body.reason, req.user!.sub));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Production entry deleted." });
  },

  async addFile(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.addFile(req.params.id, req.body.kind, req.body.fileName, req.body.fileUrl, req.user!.sub));
  },
};
