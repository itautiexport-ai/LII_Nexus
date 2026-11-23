import { Request, Response } from "express";
import { CostingService } from "../../application/services/CostingService";

export class CostingController {
  constructor(private costingService: CostingService = new CostingService()) {}

  getApprovalAuthorities = async (_req: Request, res: Response) => {
    return res.json({ success: true, data: await this.costingService.getApprovalAuthorities() });
  };

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
    const estimation = await this.costingService.updateEstimation(id, req.body, (req as any).user?.id);
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

  calculateCft = async (req: Request, res: Response) => {
    const { length, width, thickness, pcs, rate } = req.body ?? {};
    const result = this.costingService.calculateWoodCft(
      Number(length) || 0,
      Number(width) || 0,
      Number(thickness) || 0,
      Number(pcs) || 0,
      Number(rate) || 0
    );
    return res.json({ success: true, data: result });
  };

  createRequestBunch = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const bunch = await this.costingService.createRequestBunch(req.body, userId);
    return res.status(201).json({ success: true, data: bunch });
  };

  listBunches = async (req: Request, res: Response) => {
    const { search, status, merchant } = req.query;
    const bunches = await this.costingService.listBunches(
      search as string,
      status as string,
      merchant as string
    );
    return res.json({ success: true, data: bunches });
  };

  getBunchById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const bunch = await this.costingService.getBunchById(id);
    if (!bunch) {
      return res.status(404).json({ success: false, error: { message: "Costing request bunch not found" } });
    }
    return res.json({ success: true, data: bunch });
  };

  listRequestItems = async (req: Request, res: Response) => {
    const { search, stage, priority, bunchCode, merchant } = req.query;
    const items = await this.costingService.listRequestItems(
      search as string,
      stage as string,
      priority as string,
      bunchCode as string,
      merchant as string
    );
    return res.json({ success: true, data: items });
  };

  getRequestItemById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await this.costingService.getRequestItemById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: { message: "Costing request item not found" } });
    }
    return res.json({ success: true, data: item });
  };

  updateRequestItemStage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stage, estimationId, estimationNumber, finalPrice, finalPriceUsd } = req.body;

    const updated = await this.costingService.updateRequestItemStage(
      id,
      stage,
      estimationId,
      estimationNumber,
      finalPrice,
      finalPriceUsd,
      (req as any).user?.sub
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: "Costing request item not found" } });
    }
    return res.json({ success: true, data: { updated: true } });
  };

  getTrackerData = async (req: Request, res: Response) => {
    const { search, stage, merchant, dateFrom, dateTo } = req.query;
    const tracker = await this.costingService.getTrackerData(
      search as string,
      stage as string,
      merchant as string,
      dateFrom as string,
      dateTo as string
    );
    return res.json({ success: true, data: tracker });
  };

  getDashboardMetrics = async (_req: Request, res: Response) => {
    const data = await this.costingService.getDashboardMetrics();
    return res.json({ success: true, data });
  };

  getNextCodes = async (req: Request, res: Response) => {
    const count = parseInt((req.query.count as string) || "1", 10);
    const data = await this.costingService.getNextCodes(count);
    return res.json({ success: true, data });
  };
}
