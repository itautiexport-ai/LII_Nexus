import { Response } from "express";
import { ProductionLineService } from "../../application/services/ProductionLineService";
import { MySqlProductionLineRepository } from "../../infrastructure/repositories/MySqlProductionLineRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const service = new ProductionLineService(new MySqlProductionLineRepository());

export const ProductionLineController = {
  async list(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.list());
  },
  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await service.create(req.body, req.user!.sub));
  },
  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.update(req.params.id, req.body, req.user!.sub));
  },
  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Production line deleted." });
  },
};
