import { Request, Response } from "express";
import { ModuleWeightService } from "../../application/services/ModuleWeightService";

export class ModuleWeightController {
  static async getWeights(req: Request, res: Response) {
    const weights = await ModuleWeightService.getWeights();
    res.json({ data: weights });
  }

  static async updateWeights(req: Request, res: Response) {
    const { fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight } = req.body;
    
    if (fmsWeight === undefined || checklistWeight === undefined || delegationWeight === undefined
        || hodWeight === undefined || hrWeight === undefined) {
      return res.status(400).json({ error: { message: "fmsWeight, checklistWeight, delegationWeight, hodWeight, and hrWeight are required" } });
    }

    const weights = await ModuleWeightService.updateWeights(
      Number(fmsWeight),
      Number(checklistWeight),
      Number(delegationWeight),
      Number(hodWeight),
      Number(hrWeight)
    );
    res.json({ data: weights, message: "Weights updated successfully" });
  }
}
