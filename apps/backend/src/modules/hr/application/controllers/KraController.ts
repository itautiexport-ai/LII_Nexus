import { Request, Response } from "express";
import { KraRepository } from "../../infrastructure/repositories/KraRepository";

const repo = new KraRepository();

export class KraController {
  static async list(req: Request, res: Response) {
    try {
      const { departmentId } = req.query;
      const kras = await repo.findAll(departmentId as string);
      res.json({ success: true, data: kras });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { departmentId, designationId, title, description, attachmentUrl } = req.body;
      if (!departmentId || !title) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      const kra = await repo.create({ departmentId, designationId, title, description, attachmentUrl });
      res.status(201).json({ success: true, data: kra });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.delete(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
