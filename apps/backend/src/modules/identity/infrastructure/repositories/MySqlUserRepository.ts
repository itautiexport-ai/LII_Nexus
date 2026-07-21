import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { User } from "../../domain/entities/User";
import { CreateUserData, IUserRepository, UpdateUserData } from "../../domain/repositories/IUserRepository";

function mapRow(row: any): User {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    email: row.email,
    passwordHash: row.password_hash,
    tempPassword: row.temp_password,
    fullName: row.full_name,
    whatsappNumber: row.whatsapp_number,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export class MySqlUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM users WHERE (email = ? OR employee_code = ?) AND deleted_at IS NULL",
      [identifier, identifier]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async list(params: { page: number; pageSize: number; search?: string }) {
    const offset = (params.page - 1) * params.pageSize;
    const searchClause = params.search ? "AND (email LIKE ? OR full_name LIKE ?)" : "";
    const searchParams = params.search ? [`%${params.search}%`, `%${params.search}%`] : [];

    const [rows] = await pool.query<any[]>(
      `SELECT * FROM users WHERE deleted_at IS NULL ${searchClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...searchParams, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL ${searchClause}`,
      searchParams
    );
    return { items: rows.map(mapRow), total: countRows[0].total as number };
  }

  async create(data: CreateUserData): Promise<User> {
    const id = data.id || uuid();
    await pool.query(
      `INSERT INTO users (id, employee_code, email, password_hash, temp_password, full_name, whatsapp_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, data.employeeCode, data.email, data.passwordHash, data.tempPassword || null, data.fullName, data.whatsappNumber || null]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: UpdateUserData): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.employeeCode !== undefined) { fields.push("employee_code = ?"); values.push(changes.employeeCode); }
    if (changes.fullName !== undefined) { fields.push("full_name = ?"); values.push(changes.fullName); }
    if (changes.whatsappNumber !== undefined) { fields.push("whatsapp_number = ?"); values.push(changes.whatsappNumber); }
    if (changes.status !== undefined) { fields.push("status = ?"); values.push(changes.status); }
    if (changes.passwordHash !== undefined) { fields.push("password_hash = ?"); values.push(changes.passwordHash); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
  }

  async touchLastLogin(id: string): Promise<void> {
    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [id]);
  }
}
