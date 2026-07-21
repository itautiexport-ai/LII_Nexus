import { Pool, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface IssuedNotice {
  id?: string;
  employee_name: string;
  person_type: string;
  department: string;
  notice_type: string;
  category: string;
  issue_date: string;
  letter_body?: string;
  created_at?: string;
  updated_at?: string;
}

export class MySqlNoticeRepository {
  constructor(private readonly pool: Pool) {}

  async createNotice(notice: Partial<IssuedNotice>): Promise<IssuedNotice> {
    const id = uuidv4();
    const { employee_name, person_type, department, notice_type, category, issue_date, letter_body } = notice;
    
    await this.pool.query(
      `INSERT INTO issued_notices 
       (id, employee_name, person_type, department, notice_type, category, issue_date, letter_body) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, employee_name, person_type, department, notice_type, category, issue_date, letter_body || null]
    );

    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM issued_notices WHERE id = ?', [id]);
    return rows[0] as IssuedNotice;
  }

  async getNotices(): Promise<IssuedNotice[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM issued_notices ORDER BY issue_date DESC, created_at DESC');
    return rows as IssuedNotice[];
  }

  async deleteNotice(id: string): Promise<void> {
    await this.pool.query('DELETE FROM issued_notices WHERE id = ?', [id]);
  }
}
