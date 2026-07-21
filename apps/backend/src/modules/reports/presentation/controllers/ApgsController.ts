import { Request, Response } from "express";
import { MisService } from "../../application/services/ApgsService";
import { ok } from "../../../../shared/utils/apiResponse";

const misService = new MisService();

export const ApgsController = {
  async getScore(req: Request, res: Response) {
    const { employeeId } = req.params;
    const { period = "monthly" } = req.query;
    if (!employeeId) {
      throw new Error("Employee ID is required");
    }
    const report = await misService.generateReport(employeeId, period as string);
    return ok(res, report);
  },

  async saveManagerEvaluation(req: Request, res: Response) {
    const { employeeId } = req.params;
    const {
      periodType,
      periodStart,
      periodEnd,
      qualityOfWork,
      technicalCompetence,
      leadership,
      discipline,
      teamBehaviour,
      initiative,
      costSaving,
      problemSolving
    } = req.body;

    const evaluatedBy = (req as any).user.sub;

    await misService.saveManagerEvaluation(
      employeeId,
      evaluatedBy,
      periodType,
      periodStart,
      periodEnd,
      {
        qualityOfWork,
        technicalCompetence,
        leadership,
        discipline,
        teamBehaviour,
        initiative,
        costSaving,
        problemSolving
      }
    );

    return ok(res, { message: "Manager evaluation saved successfully" });
  },

  async getCumulativeScores(req: Request, res: Response) {
    const { period = "yearly" } = req.query;
    const reports = await misService.getCumulativeScores(period as string);
    return ok(res, reports);
  }
};
