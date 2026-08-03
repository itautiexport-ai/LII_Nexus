import { Request, Response } from "express";
import { officeEmService } from "../../application/services/OfficeEmService";
import { ok } from "../../../../shared/utils/apiResponse";

export const OfficeEmController = {
  async getGapScore(req: Request, res: Response) {
    const { employeeId } = req.params;
    const { period = "monthly" } = req.query;

    const report = await officeEmService.generateGapScoreReport(employeeId, period as string);
    return ok(res, report);
  },

  async getGapScoreList(req: Request, res: Response) {
    const { period = "monthly" } = req.query;
    const reportList = await officeEmService.generateGapScoreList(period as string);
    return ok(res, reportList);
  }
};
