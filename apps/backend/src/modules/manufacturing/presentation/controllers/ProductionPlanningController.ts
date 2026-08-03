import { Request, Response } from "express";
import { productionPlanningService } from "../../application/services/ProductionPlanningService";
import { ok, created } from "../../../../shared/utils/apiResponse";

export const ProductionPlanningController = {
  async createRecord(req: Request, res: Response) {
    const input = req.body;
    const createdBy = (req as any).user?.id || "system";
    
    // Add attachment_url if a file was uploaded
    const file = req.file;
    if (file) {
      input.attachmentUrl = `/uploads/${file.filename}`;
    }
    
    const record = await productionPlanningService.createRecord(input, createdBy);
    return created(res, record);
  },

  async getRecords(req: Request, res: Response) {
    const records = await productionPlanningService.getRecords();
    return ok(res, records);
  },

  async deleteRecord(req: Request, res: Response) {
    const { id } = req.params;
    await productionPlanningService.deleteRecord(id);
    return ok(res, { message: "Record deleted successfully" });
  },

  async updateCbmSplit(req: Request, res: Response) {
    const { id } = req.params;
    const { sezCbm, sirsiCbm, vendorCbm, vendorName } = req.body;
    await productionPlanningService.updateCbmSplit(id, Number(sezCbm), Number(sirsiCbm), Number(vendorCbm), vendorName);
    return ok(res, { message: "CBM split updated successfully" });
  },

  async updateProcessCbm(req: Request, res: Response) {
    const { id } = req.params;
    const { machineShopCbm, assemblyCbm, sandingCbm, finishingCbm, packingCbm } = req.body;
    await productionPlanningService.updateProcessCbm(id, Number(machineShopCbm), Number(assemblyCbm), Number(sandingCbm), Number(finishingCbm), Number(packingCbm));
    return ok(res, { message: "Process CBM updated successfully" });
  }
};
