import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Format } from "../../domain/entities/Format";
import { v4 as uuid } from "uuid";

export class MySqlFormatRepository {
  async findAll(): Promise<Format[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM formats ORDER BY created_at ASC");
    return rows.map(this.mapRowToFormat);
  }

  async save(formatData: Omit<Format, "id" | "createdAt" | "updatedAt">): Promise<Format> {
    const id = uuid();
    const now = new Date();
    await pool.query(
      `INSERT INTO formats (id, title, description, icon, file_url, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        formatData.title,
        formatData.description || null,
        formatData.icon || null,
        formatData.fileUrl,
        now,
        now
      ]
    );
    return new Format(
      id,
      formatData.title,
      formatData.description || null,
      formatData.icon || null,
      formatData.fileUrl,
      now,
      now
    );
  }

  private mapRowToFormat(row: any): Format {
    return new Format(
      row.id,
      row.title,
      row.description,
      row.icon,
      row.file_url,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
