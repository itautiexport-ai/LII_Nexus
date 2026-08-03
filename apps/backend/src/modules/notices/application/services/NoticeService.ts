import { MySqlNoticeRepository, IssuedNotice } from '../../infrastructure/repositories/MySqlNoticeRepository';

export class NoticeService {
  constructor(private readonly repo: MySqlNoticeRepository) {}

  async createNotice(notice: Partial<IssuedNotice>): Promise<IssuedNotice> {
    return this.repo.createNotice(notice);
  }

  async getNotices(): Promise<IssuedNotice[]> {
    return this.repo.getNotices();
  }

  async deleteNotice(id: string): Promise<void> {
    return this.repo.deleteNotice(id);
  }
}
