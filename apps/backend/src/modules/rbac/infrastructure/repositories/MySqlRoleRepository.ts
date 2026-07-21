import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Permission, Role } from "../../domain/entities/Role";
import { IRoleRepository } from "../../domain/repositories/IRoleRepository";

function mapRole(row: any): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystemRole: !!row.is_system_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPermission(row: any): Permission {
  return { id: row.id, key: row.key, module: row.module, description: row.description };
}

export class MySqlRoleRepository implements IRoleRepository {
  async list(): Promise<Role[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM roles ORDER BY name ASC");
    return rows.map(mapRole);
  }

  async findById(id: string): Promise<Role | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM roles WHERE id = ?", [id]);
    return rows[0] ? mapRole(rows[0]) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM roles WHERE name = ?", [name]);
    return rows[0] ? mapRole(rows[0]) : null;
  }

  async create(data: { id: string; name: string; description?: string | null }): Promise<Role> {
    const id = data.id || uuid();
    await pool.query("INSERT INTO roles (id, name, description, is_system_role) VALUES (?, ?, ?, 0)", [
      id,
      data.name,
      data.description ?? null,
    ]);
    return (await this.findById(id))!;
  }

  async update(id: string, changes: { name?: string; description?: string | null }): Promise<Role> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.name !== undefined) { fields.push("name = ?"); values.push(changes.name); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE roles SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM roles WHERE id = ? AND is_system_role = 0", [id]);
  }

  async listPermissions(): Promise<Permission[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM permissions ORDER BY module, `key`");
    return rows.map(mapPermission);
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows.map(mapPermission);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);
      for (const permissionId of permissionIds) {
        await conn.query("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, permissionId]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getRolesForUser(userId: string): Promise<Role[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT DISTINCT r.* FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows.map(mapRole);
  }

  async getPermissionKeysForUser(userId: string): Promise<string[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT DISTINCT p.\`key\` as \`key\` FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows.map((r) => r.key);
  }

  async assignRoleToUser(userId: string, roleId: string, scopeType: string, scopeId: string): Promise<void> {
    await pool.query(
      "INSERT IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES (?, ?, ?, ?)",
      [userId, roleId, scopeType, scopeId]
    );
  }

  async removeRoleFromUser(userId: string, roleId: string, scopeType: string, scopeId: string): Promise<void> {
    await pool.query(
      "DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND scope_type = ? AND scope_id = ?",
      [userId, roleId, scopeType, scopeId]
    );
  }
}
