import { MySqlTrainingRepository, TrainingCalendar, TrainingSession } from '../../infrastructure/repositories/MySqlTrainingRepository';

export class TrainingService {
  constructor(private readonly repo: MySqlTrainingRepository) {}

  async getCalendars(): Promise<TrainingCalendar[]> {
    return this.repo.listCalendars();
  }

  async createCalendar(financial_year: string): Promise<TrainingCalendar> {
    return this.repo.createCalendar(financial_year);
  }

  async getSessions(calendar_id?: string): Promise<TrainingSession[]> {
    return this.repo.listSessions(calendar_id);
  }

  async createSession(session: Partial<TrainingSession>): Promise<TrainingSession> {
    return this.repo.createSession(session);
  }

  async updateSessionStatus(id: string, status: string): Promise<void> {
    return this.repo.updateSessionStatus(id, status);
  }

  async deleteSession(id: string): Promise<void> {
    return this.repo.deleteSession(id);
  }
}
