import { Request, Response } from "express";
import { SecurityCustomRepository } from "../../infrastructure/repositories/SecurityCustomRepository";

const repo = new SecurityCustomRepository();

export class SecurityCustomController {
  // Security Night Form
  static async getNightForms(_req: Request, res: Response) {
    try {
      const records = await repo.findAllNightForms();
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createNightForm(req: Request, res: Response) {
    try {
      const { guardName, shiftDate, gateLocation, patrolStatus, observations, remarks, imageUrl, photoCapturedAt } = req.body;
      if (!guardName || !shiftDate) {
        return res.status(400).json({ success: false, error: "Guard name and shift date are required." });
      }
      const record = await repo.createNightForm({
        guardName,
        shiftDate,
        gateLocation,
        patrolStatus,
        observations,
        remarks,
        imageUrl,
        photoCapturedAt,
      });
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteNightForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteNightForm(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Visitor Entry
  static async getVisitorEntries(_req: Request, res: Response) {
    try {
      const records = await repo.findAllVisitorEntries();
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createVisitorEntry(req: Request, res: Response) {
    try {
      const { visitorName, phone, companyName, personToMeet, purpose } = req.body;
      if (!visitorName) {
        return res.status(400).json({ success: false, error: "Visitor name is required." });
      }
      const record = await repo.createVisitorEntry({
        visitorName,
        phone,
        companyName,
        personToMeet,
        purpose,
      });
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async checkOutVisitorEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const record = await repo.checkOutVisitorEntry(id);
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteVisitorEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteVisitorEntry(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
