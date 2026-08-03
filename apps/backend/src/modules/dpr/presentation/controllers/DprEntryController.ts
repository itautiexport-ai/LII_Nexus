import { Response } from "express";
import { DprEntryService } from "../../application/services/DprEntryService";
import { MySqlDprEntryRepository } from "../../infrastructure/repositories/MySqlDprEntryRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const service = new DprEntryService(new MySqlDprEntryRepository(), new EmployeeScopeService());

export const DprEntryController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "50", 10);
    const entryDate = req.query.entryDate as string | undefined;
    const factoryDepartmentId = req.query.factoryDepartmentId as string | undefined;

    const { items, total } = await service.list({ page, pageSize, entryDate, factoryDepartmentId });
    return ok(res, items, { page, pageSize, totalItems: total });
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getById(req.params.id));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    console.log("Create DPR payload:", JSON.stringify(req.body, null, 2));
    return created(res, await service.create(req.body, req.user!.sub));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "DPR entry deleted." });
  },
};
