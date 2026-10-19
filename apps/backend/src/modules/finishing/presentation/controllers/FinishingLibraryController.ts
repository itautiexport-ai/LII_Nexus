import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { FinishingLibraryRepository } from "../../infrastructure/repositories/FinishingLibraryRepository";

const repo = new FinishingLibraryRepository();

export class FinishingLibraryController {
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
        return res.status(404).json({ success: false, error: "Library item not found" });
      }
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { buyerName, buyerCode, finishRecipeCode, recipeId, photos, remarks } = req.body;
      const createdBy = req.user!.sub;

      if (!buyerName || !finishRecipeCode) {
        return res.status(400).json({ success: false, error: "Buyer name and finish recipe code are required." });
      }

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ success: false, error: "At least one swatch photo is required." });
      }

      const record = await repo.create({
        buyerName,
        buyerCode,
        finishRecipeCode,
        recipeId,
        photos,
        remarks,
        createdBy,
      });

      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await repo.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Library item not found" });
      }
      res.json({ success: true, message: "Item deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
