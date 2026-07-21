import { Request, Response } from 'express';
import { NoticeService } from '../../application/services/NoticeService';

export class NoticeController {
  constructor(private readonly service: NoticeService) {}

  async createNotice(req: Request, res: Response) {
    try {
      const notice = await this.service.createNotice(req.body);
      res.status(201).json({ success: true, data: notice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getNotices(req: Request, res: Response) {
    try {
      const notices = await this.service.getNotices();
      res.json({ success: true, data: notices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async deleteNotice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteNotice(id);
      res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}
