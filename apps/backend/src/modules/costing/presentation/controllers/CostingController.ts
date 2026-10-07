import { Request, Response } from "express";
import { CostingService } from "../../application/services/CostingService";

export class CostingController {
  constructor(private costingService: CostingService = new CostingService()) {}

  getSummary = async (_req: Request, res: Response) => {
    const summary = await this.costingService.getSummary();
    return res.json({ success: true, data: summary });
  };

  getAllEstimations = async (req: Request, res: Response) => {
    const { search, status } = req.query;
    const estimations = await this.costingService.getAllEstimations(
      search as string,
      status as string
    );
    return res.json({ success: true, data: estimations });
  };

  getEstimationById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const estimation = await this.costingService.getEstimationById(id);
    if (!estimation) {
      return res.status(404).json({ success: false, error: { message: "Cost estimation not found" } });
    }
    return res.json({ success: true, data: estimation });
  };

  createEstimation = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const estimation = await this.costingService.createEstimation(req.body, userId);
    return res.status(201).json({ success: true, data: estimation });
  };

  updateEstimation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const estimation = await this.costingService.updateEstimation(id, req.body);
    if (!estimation) {
      return res.status(404).json({ success: false, error: { message: "Cost estimation not found" } });
    }
    return res.json({ success: true, data: estimation });
  };

  deleteEstimation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.costingService.deleteEstimation(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: "Cost estimation not found" } });
    }
    return res.json({ success: true, data: { deleted: true } });
  };

  getAllRates = async (_req: Request, res: Response) => {
    const rates = await this.costingService.getAllRates();
    return res.json({ success: true, data: rates });
  };

  saveRate = async (req: Request, res: Response) => {
    const rate = await this.costingService.saveRate(req.body);
    return res.status(201).json({ success: true, data: rate });
  };

  deleteRate = async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.costingService.deleteRate(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: "Rate item not found" } });
    }
    return res.json({ success: true, data: { deleted: true } });
  };
}
