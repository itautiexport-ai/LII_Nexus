import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ProductionLine } from "../../domain/entities/ProductionLine";
import { IProductionLineRepository } from "../../domain/repositories/IProductionLineRepository";

function mapRow(row: any): ProductionLine {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export class MySqlProductionLineRepository implements IProductionLineRepository {
  async list(): Promise<ProductionLine[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM production_lines WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<ProductionLine | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM production_lines WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByName(name: string): Promise<ProductionLine | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM production_lines WHERE name = ? AND deleted_at IS NULL", [name]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: { id: string; name: string; code?: string | null; description?: string | null }): Promise<ProductionLine> {
    const id = data.id || uuid();
    await pool.query("INSERT INTO production_lines (id, name, code, description) VALUES (?, ?, ?, ?)", [
      id, data.name, data.code ?? null, data.description ?? null,
    ]);
    return (await this.findById(id))!;
  }

  async update(id: string, changes: { name?: string; code?: string | null; description?: string | null }): Promise<ProductionLine> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.name !== undefined) { fields.push("name = ?"); values.push(changes.name); }
    if (changes.code !== undefined) { fields.push("code = ?"); values.push(changes.code); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE production_lines SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE production_lines SET deleted_at = NOW() WHERE id = ?", [id]);
  }
}
