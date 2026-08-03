import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { UrlRecord } from "../../domain/entities/Url";
import { IUrlRepository } from "../../domain/repositories/IUrlRepository";

function mapUrl(row: any): UrlRecord {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MySqlUrlRepository implements IUrlRepository {
  async create(data: { id?: string; title: string; url: string; createdBy: string | null }): Promise<UrlRecord> {
    const id = data.id || uuid();
    await pool.query(
      "INSERT INTO important_urls (id, title, url, created_by) VALUES (?, ?, ?, ?)",
      [id, data.title, data.url, data.createdBy]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM important_urls WHERE id = ?", [id]);
    return mapUrl(rows[0]);
  }

  async list(): Promise<UrlRecord[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM important_urls WHERE deleted_at IS NULL ORDER BY created_at DESC");
    return rows.map(mapUrl);
  }

  async remove(id: string): Promise<void> {
    await pool.query("UPDATE important_urls SET deleted_at = NOW() WHERE id = ?", [id]);
  }
}
