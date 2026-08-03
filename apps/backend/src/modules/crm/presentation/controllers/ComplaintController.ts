import { Request, Response } from "express";
import { ComplaintService } from "../../application/services/ComplaintService";
import { ComplaintPriority, ComplaintStatus } from "../../domain/entities/Complaint";

export class ComplaintController {
  constructor(private service: ComplaintService) {}

  create = async (req: Request, res: Response) => {
    try {
      const complaint = await this.service.create(req.body);
      res.status(201).json(complaint);
    } catch (err: any) {
      console.error("COMPLAINT CREATION ERROR:", err);
      res.status(400).json({ error: { message: err.message } });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const { search, status, priority, buyerId, assignedTo } = req.query;
      const result = await this.service.list({
        search: search as string,
        status: status as ComplaintStatus,
        priority: priority as ComplaintPriority,
        buyerId: buyerId as string,
        assignedTo: assignedTo as string
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const complaint = await this.service.getById(req.params.id);
      res.json(complaint);
    } catch (err: any) {
      res.status(404).json({ error: { message: err.message } });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const complaint = await this.service.update(req.params.id, req.body);
      res.json(complaint);
    } catch (err: any) {
      res.status(400).json({ error: { message: err.message } });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: { message: err.message } });
    }
  };
}
