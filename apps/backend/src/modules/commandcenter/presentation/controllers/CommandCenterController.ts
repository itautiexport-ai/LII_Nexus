import { Response } from "express";
import { CommandCenterService } from "../../application/services/CommandCenterService";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";

const service = new CommandCenterService();

export const CommandCenterController = {
  async getOverview(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await service.getOverview());
  },
};
