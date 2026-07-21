import { Request, Response } from "express";
import { HelpTicketService } from "../../application/services/HelpTicketService";
import { CreateHelpTicketSchema, UpdateHelpTicketStatusSchema } from "../../application/dto/helpTicket.dto";

const service = new HelpTicketService();

export class HelpTicketController {
  async create(req: Request, res: Response) {
    const parsed = CreateHelpTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const ticket = await service.createTicket(parsed.data, userId);
    return res.status(201).json(ticket);
  }

  async listAll(_req: Request, res: Response) {
    const tickets = await service.listAll();
    return res.json(tickets);
  }

  async listAssignedToMe(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const tickets = await service.listAssignedToMe(userId);
    return res.json(tickets);
  }

  async listAssignedByMe(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const tickets = await service.listAssignedByMe(userId);
    return res.json(tickets);
  }

  async getById(req: Request, res: Response) {
    const ticket = await service.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    return res.json(ticket);
  }

  async updateStatus(req: Request, res: Response) {
    const parsed = UpdateHelpTicketStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const ticket = await service.updateStatus(req.params.id, parsed.data);
    return res.json(ticket);
  }
}
