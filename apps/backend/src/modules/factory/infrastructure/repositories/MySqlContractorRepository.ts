import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Contractor } from "../../domain/entities/Contractor";
import { MasterStatus } from "../../domain/entities/FactoryDepartment";
import { IContractorRepository } from "../../domain/repositories/IContractorRepository";

function mapRow(row: any): Contractor {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export class MySqlContractorRepository implements IContractorRepository {
  async list(status?: MasterStatus): Promise<Contractor[]> {
    const conditions = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    if (status) { conditions.push("status = ?"); values.push(status); }
    const [rows] = await pool.query<any[]>(`SELECT * FROM contractors WHERE ${conditions.join(" AND ")} ORDER BY name ASC`, values);
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Contractor | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM contractors WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: { id: string; name: string; contactPerson?: string | null; phone?: string | null; email?: string | null }): Promise<Contractor> {
    const id = data.id || uuid();
    await pool.query(
      "INSERT INTO contractors (id, name, contact_person, phone, email) VALUES (?, ?, ?, ?, ?)",
      [id, data.name, data.contactPerson ?? null, data.phone ?? null, data.email ?? null]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: { name?: string; contactPerson?: string | null; phone?: string | null; email?: string | null; status?: MasterStatus }): Promise<Contractor> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.name !== undefined) { fields.push("name = ?"); values.push(changes.name); }
    if (changes.contactPerson !== undefined) { fields.push("contact_person = ?"); values.push(changes.contactPerson); }
    if (changes.phone !== undefined) { fields.push("phone = ?"); values.push(changes.phone); }
    if (changes.email !== undefined) { fields.push("email = ?"); values.push(changes.email); }
    if (changes.status !== undefined) { fields.push("status = ?"); values.push(changes.status); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE contractors SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE contractors SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
  }
}
