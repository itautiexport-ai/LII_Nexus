import { Pool, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface TrainingCalendar {
  id: string;
  financial_year: string;
  status: string;
}

export interface TrainingSession {
  id: string;
  calendar_id: string;
  title: string;
  category: string;
  department_id: string | null;
  training_type: string;
  priority: string;
  scheduled_date: string;
  duration_hours: number;
  trainer: string;
  venue_mode: string;
  budget: number;
  status: string;
  description: string;
}

export class MySqlTrainingRepository {
  constructor(private readonly pool: Pool) {}

  async listCalendars(): Promise<TrainingCalendar[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM training_calendars ORDER BY created_at DESC');
    return rows as TrainingCalendar[];
  }

  async createCalendar(financial_year: string): Promise<TrainingCalendar> {
    const id = uuidv4();
    await this.pool.query(
      'INSERT INTO training_calendars (id, financial_year) VALUES (?, ?)',
      [id, financial_year]
    );
    return { id, financial_year, status: 'active' };
  }

  async listSessions(calendar_id?: string): Promise<TrainingSession[]> {
    let query = 'SELECT * FROM training_sessions';
    const params: any[] = [];
    if (calendar_id) {
      query += ' WHERE calendar_id = ?';
      params.push(calendar_id);
    }
    query += ' ORDER BY scheduled_date DESC';
    const [rows] = await this.pool.query<RowDataPacket[]>(query, params);
    return rows as TrainingSession[];
  }

  async createSession(session: Partial<TrainingSession>): Promise<TrainingSession> {
    const id = uuidv4();
    await this.pool.query(
      `INSERT INTO training_sessions 
      (id, calendar_id, title, category, department_id, training_type, priority, scheduled_date, duration_hours, trainer, venue_mode, budget, status, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, session.calendar_id, session.title, session.category, session.department_id || null, 
        session.training_type || 'internal', session.priority || 'medium', session.scheduled_date || null, 
        session.duration_hours || 0, session.trainer, session.venue_mode, session.budget || 0, 
        session.status || 'planned', session.description || ''
      ]
    );
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM training_sessions WHERE id = ?', [id]);
    return rows[0] as TrainingSession;
  }

  async updateSessionStatus(id: string, status: string): Promise<void> {
    await this.pool.query(
      'UPDATE training_sessions SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.pool.query('DELETE FROM training_sessions WHERE id = ?', [id]);
  }
}
