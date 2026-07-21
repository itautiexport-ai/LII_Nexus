"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlDepartmentRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
function mapRow(row) {
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
class MySqlDepartmentRepository {
    async list() {
        const [rows] = await connection_1.pool.query("SELECT * FROM departments WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows.map(mapRow);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByName(name) {
        const [rows] = await connection_1.pool.query("SELECT * FROM departments WHERE name = ? AND deleted_at IS NULL", [name]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        try {
            await connection_1.pool.query("INSERT INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)", [
                id, data.name, data.code ?? null, data.description ?? null,
            ]);
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                throw new DomainError_1.ConflictError("A department with this name or code already exists.");
            throw err;
        }
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.name !== undefined) {
            fields.push("name = ?");
            values.push(changes.name);
        }
        if (changes.code !== undefined) {
            fields.push("code = ?");
            values.push(changes.code);
        }
        if (changes.description !== undefined) {
            fields.push("description = ?");
            values.push(changes.description);
        }
        if (fields.length > 0) {
            values.push(id);
            try {
                await connection_1.pool.query(`UPDATE departments SET ${fields.join(", ")} WHERE id = ?`, values);
            }
            catch (err) {
                if (err.code === "ER_DUP_ENTRY")
                    throw new DomainError_1.ConflictError("A department with this name or code already exists.");
                throw err;
            }
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        try {
            await connection_1.pool.query("DELETE FROM departments WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE departments SET deleted_at = NOW(), name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)), code = IF(code IS NULL, NULL, CONCAT(code, '-del-', SUBSTRING(id, 1, 6))) WHERE id = ?", [id]);
            }
            else {
                throw err;
            }
        }
    }
}
exports.MySqlDepartmentRepository = MySqlDepartmentRepository;
//# sourceMappingURL=MySqlDepartmentRepository.js.map