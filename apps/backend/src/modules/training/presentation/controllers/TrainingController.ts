import { Request, Response } from 'express';
import { TrainingService } from '../../application/services/TrainingService';

export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  async listCalendars(req: Request, res: Response) {
    try {
      const c = await this.service.getCalendars();
      res.json({ success: true, data: c });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async createCalendar(req: Request, res: Response) {
    try {
      const { financial_year } = req.body;
      const c = await this.service.createCalendar(financial_year);
      res.json({ success: true, data: c });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async listSessions(req: Request, res: Response) {
    try {
      const { calendar_id } = req.query;
      const s = await this.service.getSessions(calendar_id as string | undefined);
      res.json({ success: true, data: s });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async createSession(req: Request, res: Response) {
    try {
      const session = req.body;
      const s = await this.service.createSession(session);
      res.json({ success: true, data: s });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async updateSessionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await this.service.updateSessionStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async deleteSession(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteSession(id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}
