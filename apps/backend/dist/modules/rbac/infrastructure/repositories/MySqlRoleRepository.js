"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlRoleRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRole(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        isSystemRole: !!row.is_system_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function mapPermission(row) {
    return { id: row.id, key: row.key, module: row.module, description: row.description };
}
class MySqlRoleRepository {
    async list() {
        const [rows] = await connection_1.pool.query("SELECT * FROM roles ORDER BY name ASC");
        return rows.map(mapRole);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM roles WHERE id = ?", [id]);
        return rows[0] ? mapRole(rows[0]) : null;
    }
    async findByName(name) {
        const [rows] = await connection_1.pool.query("SELECT * FROM roles WHERE name = ?", [name]);
        return rows[0] ? mapRole(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO roles (id, name, description, is_system_role) VALUES (?, ?, ?, 0)", [
            id,
            data.name,
            data.description ?? null,
        ]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.name !== undefined) {
            fields.push("name = ?");
            values.push(changes.name);
        }
        if (changes.description !== undefined) {
            fields.push("description = ?");
            values.push(changes.description);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE roles SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async delete(id) {
        await connection_1.pool.query("DELETE FROM roles WHERE id = ? AND is_system_role = 0", [id]);
    }
    async listPermissions() {
        const [rows] = await connection_1.pool.query("SELECT * FROM permissions ORDER BY module, `key`");
        return rows.map(mapPermission);
    }
    async getPermissionsForRole(roleId) {
        const [rows] = await connection_1.pool.query(`SELECT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ?`, [roleId]);
        return rows.map(mapPermission);
    }
    async setRolePermissions(roleId, permissionIds) {
        const conn = await connection_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);
            for (const permissionId of permissionIds) {
                await conn.query("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, permissionId]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    async getRolesForUser(userId) {
        const [rows] = await connection_1.pool.query(`SELECT DISTINCT r.* FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`, [userId]);
        return rows.map(mapRole);
    }
    async getPermissionKeysForUser(userId) {
        const [rows] = await connection_1.pool.query(`SELECT DISTINCT p.\`key\` as \`key\` FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`, [userId]);
        return rows.map((r) => r.key);
    }
    async assignRoleToUser(userId, roleId, scopeType, scopeId) {
        await connection_1.pool.query("INSERT IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES (?, ?, ?, ?)", [userId, roleId, scopeType, scopeId]);
    }
    async removeRoleFromUser(userId, roleId, scopeType, scopeId) {
        await connection_1.pool.query("DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND scope_type = ? AND scope_id = ?", [userId, roleId, scopeType, scopeId]);
    }
}
exports.MySqlRoleRepository = MySqlRoleRepository;
//# sourceMappingURL=MySqlRoleRepository.js.map