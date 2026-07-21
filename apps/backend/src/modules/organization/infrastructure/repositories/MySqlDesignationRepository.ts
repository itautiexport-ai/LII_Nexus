import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Designation } from "../../domain/entities/Designation";
import { IDesignationRepository } from "../../domain/repositories/IDesignationRepository";
import { ConflictError } from "../../../../core/domain/errors/DomainError";

function mapRow(row: any): Designation {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export class MySqlDesignationRepository implements IDesignationRepository {
  async list(): Promise<Designation[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM designations WHERE deleted_at IS NULL ORDER BY title ASC");
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Designation | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM designations WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByTitle(title: string): Promise<Designation | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM designations WHERE title = ? AND deleted_at IS NULL", [title]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: { id: string; title: string; description?: string | null }): Promise<Designation> {
    const id = data.id || uuid();
    try {
      await pool.query("INSERT INTO designations (id, title, description) VALUES (?, ?, ?)", [
        id, data.title, data.description ?? null,
      ]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A designation with this title already exists.");
      throw err;
    }
    return (await this.findById(id))!;
  }

  async update(id: string, changes: { title?: string; description?: string | null }): Promise<Designation> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.title !== undefined) { fields.push("title = ?"); values.push(changes.title); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (fields.length > 0) {
      values.push(id);
      try {
        await pool.query(`UPDATE designations SET ${fields.join(", ")} WHERE id = ?`, values);
      } catch (err: any) {
        if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A designation with this title already exists.");
        throw err;
      }
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    try {
      await pool.query("DELETE FROM designations WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE designations SET deleted_at = NOW(), name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }
}
