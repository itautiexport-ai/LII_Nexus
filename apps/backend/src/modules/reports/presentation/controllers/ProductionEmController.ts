import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { ok } from "../../../../shared/utils/apiResponse";
import { ProductionEmService } from "../../application/services/ProductionEmService";

const service = new ProductionEmService();

export const ProductionEmController = {
  async getReport(req: AuthenticatedRequest, res: Response) {
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";
    const data = await service.getProductionEmReport(startDate, endDate);
    return ok(res, data);
  }
};
