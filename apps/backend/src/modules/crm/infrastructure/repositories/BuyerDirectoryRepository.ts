import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface BuyerDirectoryRecord {
  id: string;
  master_buyer_id: string | null;
  buyer_name: string;
  buyer_code: string | null;
  alias_name: string | null;
  country: string | null;
  city: string | null;
  existing_skus: number;
  annual_containers: number;
  monthly_containers: number;
  container_types: string | null;
  email: string | null;
  sourcing_person: string | null;
  contact_details: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateBuyerDirectoryInput {
  master_buyer_id?: string | null;
  buyer_name: string;
  buyer_code?: string | null;
  alias_name?: string | null;
  country?: string | null;
  city?: string | null;
  existing_skus?: number | null;
  annual_containers?: number | null;
  monthly_containers?: number | null;
  container_types?: string | string[] | null;
  email?: string | null;
  sourcing_person?: string | null;
  contact_details?: string | any[] | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export class BuyerDirectoryRepository {
  async list(search?: string): Promise<BuyerDirectoryRecord[]> {
    let sql = `
      SELECT b.*, mb.name as master_name, mb.buyer_code as master_code, mb.alias_name as master_alias
      FROM crm_buyer_directory b
      LEFT JOIN master_data_buyers mb ON b.master_buyer_id = mb.id
      WHERE b.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (
        b.buyer_name LIKE ? OR
        b.buyer_code LIKE ? OR
        b.alias_name LIKE ? OR
        b.country LIKE ? OR
        b.city LIKE ? OR
        b.sourcing_person LIKE ? OR
        b.email LIKE ?
      )`;
      params.push(q, q, q, q, q, q, q);
    }

    sql += " ORDER BY b.buyer_name ASC, b.created_at DESC";
    const [rows] = await pool.query<any[]>(sql, params);
    return rows;
  }

  async getById(id: string): Promise<BuyerDirectoryRecord | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM crm_buyer_directory WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data: CreateBuyerDirectoryInput, userId?: string): Promise<BuyerDirectoryRecord> {
    const id = uuid();
    const containerTypesStr = Array.isArray(data.container_types)
      ? JSON.stringify(data.container_types)
      : data.container_types || null;

    const contactDetailsStr = typeof data.contact_details === "object"
      ? JSON.stringify(data.contact_details)
      : data.contact_details || null;

    await pool.query(
      `INSERT INTO crm_buyer_directory (
        id, master_buyer_id, buyer_name, buyer_code, alias_name,
        country, city, existing_skus, annual_containers, monthly_containers,
        container_types, email, sourcing_person, contact_details,
        phone, alternate_phone, address, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.master_buyer_id || null,
        data.buyer_name.trim(),
        data.buyer_code?.trim() || null,
        data.alias_name?.trim() || null,
        data.country?.trim() || null,
        data.city?.trim() || null,
        data.existing_skus != null ? Number(data.existing_skus) : 0,
        data.annual_containers != null ? Number(data.annual_containers) : 0,
        data.monthly_containers != null ? Number(data.monthly_containers) : 0,
        containerTypesStr,
        data.email?.trim() || null,
        data.sourcing_person?.trim() || null,
        contactDetailsStr,
        data.phone?.trim() || null,
        data.alternate_phone?.trim() || null,
        data.address?.trim() || null,
        data.notes?.trim() || null,
        userId || null,
      ]
    );

    const record = await this.getById(id);
    return record!;
  }

  async update(id: string, data: Partial<CreateBuyerDirectoryInput>): Promise<BuyerDirectoryRecord> {
    const containerTypesStr = data.container_types !== undefined
      ? (Array.isArray(data.container_types) ? JSON.stringify(data.container_types) : data.container_types || null)
      : undefined;

    const contactDetailsStr = data.contact_details !== undefined
      ? (typeof data.contact_details === "object" ? JSON.stringify(data.contact_details) : data.contact_details || null)
      : undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.master_buyer_id !== undefined) {
      updates.push("master_buyer_id = ?");
      values.push(data.master_buyer_id || null);
    }
    if (data.buyer_name !== undefined) {
      updates.push("buyer_name = ?");
      values.push(data.buyer_name.trim());
    }
    if (data.buyer_code !== undefined) {
      updates.push("buyer_code = ?");
      values.push(data.buyer_code?.trim() || null);
    }
    if (data.alias_name !== undefined) {
      updates.push("alias_name = ?");
      values.push(data.alias_name?.trim() || null);
    }
    if (data.country !== undefined) {
      updates.push("country = ?");
      values.push(data.country?.trim() || null);
    }
    if (data.city !== undefined) {
      updates.push("city = ?");
      values.push(data.city?.trim() || null);
    }
    if (data.existing_skus !== undefined) {
      updates.push("existing_skus = ?");
      values.push(Number(data.existing_skus) || 0);
    }
    if (data.annual_containers !== undefined) {
      updates.push("annual_containers = ?");
      values.push(Number(data.annual_containers) || 0);
    }
    if (data.monthly_containers !== undefined) {
      updates.push("monthly_containers = ?");
      values.push(Number(data.monthly_containers) || 0);
    }
    if (containerTypesStr !== undefined) {
      updates.push("container_types = ?");
      values.push(containerTypesStr);
    }
    if (data.email !== undefined) {
      updates.push("email = ?");
      values.push(data.email?.trim() || null);
    }
    if (data.sourcing_person !== undefined) {
      updates.push("sourcing_person = ?");
      values.push(data.sourcing_person?.trim() || null);
    }
    if (contactDetailsStr !== undefined) {
      updates.push("contact_details = ?");
      values.push(contactDetailsStr);
    }
    if (data.phone !== undefined) {
      updates.push("phone = ?");
      values.push(data.phone?.trim() || null);
    }
    if (data.alternate_phone !== undefined) {
      updates.push("alternate_phone = ?");
      values.push(data.alternate_phone?.trim() || null);
    }
    if (data.address !== undefined) {
      updates.push("address = ?");
      values.push(data.address?.trim() || null);
    }
    if (data.notes !== undefined) {
      updates.push("notes = ?");
      values.push(data.notes?.trim() || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE crm_buyer_directory SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    const record = await this.getById(id);
    return record!;
  }

  async remove(id: string): Promise<void> {
    await pool.query(
      "UPDATE crm_buyer_directory SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  }
}
