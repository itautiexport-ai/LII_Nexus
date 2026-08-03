import { Request, Response } from "express";
import { QuotationService } from "../../application/services/QuotationService";

export class QuotationController {
  constructor(private readonly service: QuotationService) {}

  async listQuotations(req: Request, res: Response) {
    const data = await this.service.listQuotations();
    res.json({ success: true, data });
  }

  async createQuotation(req: Request, res: Response) {
    const data = await this.service.createQuotation(req.body);
    res.json({ success: true, data });
  }

  async updateStatus(req: Request, res: Response) {
    await this.service.updateStatus(req.params.id, req.body.status);
    res.json({ success: true });
  }

  async addQuote(req: Request, res: Response) {
    const data = await this.service.addQuote(req.params.id, req.body);
    res.json({ success: true, data });
  }

  async listQuotes(req: Request, res: Response) {
    const data = await this.service.listQuotes(req.params.id);
    res.json({ success: true, data });
  }
}
