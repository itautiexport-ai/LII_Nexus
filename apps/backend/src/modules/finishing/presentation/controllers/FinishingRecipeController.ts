import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { FinishingRecipeRepository } from "../../infrastructure/repositories/FinishingRecipeRepository";

const repo = new FinishingRecipeRepository();

export class FinishingRecipeController {
  static async getAll(req: Request, res: Response) {
    try {
      const records = await repo.findAll();
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const record = await repo.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, error: "Recipe not found" });
      }
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemCode, finishCode, itemDescription, createdOn, buyerCode, glossLevel, woodType, swatchImage, steps } = req.body;
      const createdBy = req.user!.sub;

      if (!itemCode || !finishCode) {
        return res.status(400).json({ success: false, error: "Item code and finish code are required." });
      }

      const record = await repo.create({
        itemCode,
        finishCode,
        itemDescription,
        createdOn,
        buyerCode,
        glossLevel,
        woodType,
        swatchImage,
        createdBy,
      }, steps || []);

      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
