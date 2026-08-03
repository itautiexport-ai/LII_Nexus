import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { ok } from "../../../../shared/utils/apiResponse";
import { PayrollService } from "../../application/services/PayrollService";

const service = new PayrollService();

export const PayrollController = {
  async getWeeklyPayroll(req: AuthenticatedRequest, res: Response) {
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";
    const data = await service.getWeeklyPayroll(startDate, endDate);
    return ok(res, data);
  },
  async getMonthlySalarySheet(req: AuthenticatedRequest, res: Response) {
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";
    const data = await service.getMonthlySalarySheet(startDate, endDate);
    return ok(res, data);
  }
};
