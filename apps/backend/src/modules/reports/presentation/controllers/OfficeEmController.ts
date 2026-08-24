import { Request, Response } from "express";
import { officeEmService } from "../../application/services/OfficeEmService";
import { ok } from "../../../../shared/utils/apiResponse";

export const OfficeEmController = {
  async getGapScore(req: Request, res: Response) {
    const { employeeId } = req.params;
    const { period } = req.query;

    const reportHistory = await officeEmService.generateGapScoreHistory(employeeId, period as string);
    return ok(res, reportHistory);
  },

  async getGapScoreList(req: Request, res: Response) {
    const { period = "monthly" } = req.query;
    const reportList = await officeEmService.generateGapScoreList(period as string);
    return ok(res, reportList);
  }
};
