import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Shift } from "../../domain/entities/Shift";
import { IShiftRepository } from "../../domain/repositories/IShiftRepository";

function mapRow(row: any): Shift {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export class MySqlShiftRepository implements IShiftRepository {
  async list(): Promise<Shift[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM shifts WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Shift | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM shifts WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByName(name: string): Promise<Shift | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM shifts WHERE name = ? AND deleted_at IS NULL", [name]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: { id: string; name: string; startTime?: string | null; endTime?: string | null }): Promise<Shift> {
    const id = data.id || uuid();
    await pool.query("INSERT INTO shifts (id, name, start_time, end_time) VALUES (?, ?, ?, ?)", [
      id, data.name, data.startTime ?? null, data.endTime ?? null,
    ]);
    return (await this.findById(id))!;
  }

  async update(id: string, changes: { name?: string; startTime?: string | null; endTime?: string | null }): Promise<Shift> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.name !== undefined) { fields.push("name = ?"); values.push(changes.name); }
    if (changes.startTime !== undefined) { fields.push("start_time = ?"); values.push(changes.startTime); }
    if (changes.endTime !== undefined) { fields.push("end_time = ?"); values.push(changes.endTime); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE shifts SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    try {
      await pool.query("DELETE FROM shifts WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE shifts SET deleted_at = NOW(), name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }
}
