"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlUserRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
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
class MySqlUserRepository {
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByIdentifier(identifier) {
        const [rows] = await connection_1.pool.query("SELECT * FROM users WHERE (email = ? OR employee_code = ?) AND deleted_at IS NULL", [identifier, identifier]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async list(params) {
        const offset = (params.page - 1) * params.pageSize;
        const searchClause = params.search ? "AND (email LIKE ? OR full_name LIKE ?)" : "";
        const searchParams = params.search ? [`%${params.search}%`, `%${params.search}%`] : [];
        const [rows] = await connection_1.pool.query(`SELECT * FROM users WHERE deleted_at IS NULL ${searchClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...searchParams, params.pageSize, offset]);
        const [countRows] = await connection_1.pool.query(`SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL ${searchClause}`, searchParams);
        return { items: rows.map(mapRow), total: countRows[0].total };
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO users (id, employee_code, email, password_hash, temp_password, full_name, whatsapp_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`, [id, data.employeeCode, data.email, data.passwordHash, data.tempPassword || null, data.fullName, data.whatsappNumber || null]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.employeeCode !== undefined) {
            fields.push("employee_code = ?");
            values.push(changes.employeeCode);
        }
        if (changes.fullName !== undefined) {
            fields.push("full_name = ?");
            values.push(changes.fullName);
        }
        if (changes.whatsappNumber !== undefined) {
            fields.push("whatsapp_number = ?");
            values.push(changes.whatsappNumber);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (changes.passwordHash !== undefined) {
            fields.push("password_hash = ?");
            values.push(changes.passwordHash);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        await connection_1.pool.query("UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    }
    async touchLastLogin(id) {
        await connection_1.pool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [id]);
    }
}
exports.MySqlUserRepository = MySqlUserRepository;
//# sourceMappingURL=MySqlUserRepository.js.map