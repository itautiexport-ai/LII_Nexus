import { Response } from "express";
import { ShiftService } from "../../application/services/ShiftService";
import { MySqlShiftRepository } from "../../infrastructure/repositories/MySqlShiftRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const service = new ShiftService(new MySqlShiftRepository());

export const ShiftController = {
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
    return ok(res, { message: "Shift deleted." });
  },
};
