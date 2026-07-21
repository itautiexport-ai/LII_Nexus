import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface KraRecord {
  id: string;
  department_id: string;
  designation_id: string | null;
  title: string;
  description: string | null;
  attachment_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export class KraRepository {
  async findAll(departmentId?: string): Promise<KraRecord[]> {
    if (departmentId) {
      const [rows] = await pool.query("SELECT * FROM kras WHERE department_id = ? ORDER BY created_at DESC", [departmentId]);
      return rows as KraRecord[];
    }
    const [rows] = await pool.query("SELECT * FROM kras ORDER BY created_at DESC");
    return rows as KraRecord[];
  }

  async create(data: { departmentId: string; designationId?: string; title: string; description?: string; attachmentUrl?: string }): Promise<KraRecord> {
    const id = uuid();
    await pool.query(
      "INSERT INTO kras (id, department_id, designation_id, title, description, attachment_url) VALUES (?, ?, ?, ?, ?, ?)",
      [id, data.departmentId, data.designationId || null, data.title, data.description || null, data.attachmentUrl || null]
    );
    const [rows] = await pool.query("SELECT * FROM kras WHERE id = ?", [id]);
    return (rows as KraRecord[])[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM kras WHERE id = ?", [id]);
  }
}
