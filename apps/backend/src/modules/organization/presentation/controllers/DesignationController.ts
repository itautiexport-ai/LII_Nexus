import { Response } from "express";
import { DesignationService } from "../../application/services/DesignationService";
import { MySqlDesignationRepository } from "../../infrastructure/repositories/MySqlDesignationRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const service = new DesignationService(new MySqlDesignationRepository());

export const DesignationController = {
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
    return ok(res, { message: "Designation deleted." });
  },
};
