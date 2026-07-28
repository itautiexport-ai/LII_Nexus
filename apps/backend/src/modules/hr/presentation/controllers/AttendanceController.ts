import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { ok } from "../../../../shared/utils/apiResponse";
import { AttendanceService } from "../../application/services/AttendanceService";

const service = new AttendanceService();

export const AttendanceController = {
  async saveBulk(req: AuthenticatedRequest, res: Response) {
    const data = await service.saveBulk(req.body.records);
    return ok(res, data);
  }
};
