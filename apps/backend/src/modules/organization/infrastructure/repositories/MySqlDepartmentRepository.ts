import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Department } from "../../domain/entities/Department";
import { IDepartmentRepository } from "../../domain/repositories/IDepartmentRepository";
import { ConflictError } from "../../../../core/domain/errors/DomainError";

function mapRow(row: any): Department {
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

export class MySqlDepartmentRepository implements IDepartmentRepository {
  async list(): Promise<Department[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM departments WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Department | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByName(name: string): Promise<Department | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM departments WHERE name = ? AND deleted_at IS NULL", [name]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: { id: string; name: string; code?: string | null; description?: string | null }): Promise<Department> {
    const id = data.id || uuid();
    try {
      await pool.query("INSERT INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)", [
        id, data.name, data.code ?? null, data.description ?? null,
      ]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A department with this name or code already exists.");
      throw err;
    }
    return (await this.findById(id))!;
  }

  async update(id: string, changes: { name?: string; code?: string | null; description?: string | null }): Promise<Department> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.name !== undefined) { fields.push("name = ?"); values.push(changes.name); }
    if (changes.code !== undefined) { fields.push("code = ?"); values.push(changes.code); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (fields.length > 0) {
      values.push(id);
      try {
        await pool.query(`UPDATE departments SET ${fields.join(", ")} WHERE id = ?`, values);
      } catch (err: any) {
        if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A department with this name or code already exists.");
        throw err;
      }
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    try {
      await pool.query("DELETE FROM departments WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query(
          "UPDATE departments SET deleted_at = NOW(), name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)), code = IF(code IS NULL, NULL, CONCAT(code, '-del-', SUBSTRING(id, 1, 6))) WHERE id = ?",
          [id]
        );
      } else {
        throw err;
      }
    }
  }
}
