"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlFactoryDepartmentRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
    return {
        id: row.id,
        name: row.name,
        productionMethod: row.production_method,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
class MySqlFactoryDepartmentRepository {
    async list(status) {
        const conditions = ["deleted_at IS NULL"];
        const values = [];
        if (status) {
            conditions.push("status = ?");
            values.push(status);
        }
        const [rows] = await connection_1.pool.query(`SELECT * FROM factory_departments WHERE ${conditions.join(" AND ")} ORDER BY name ASC`, values);
        return rows.map(mapRow);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM factory_departments WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByName(name) {
        const [rows] = await connection_1.pool.query("SELECT * FROM factory_departments WHERE name = ? AND deleted_at IS NULL", [name]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO factory_departments (id, name, production_method) VALUES (?, ?, ?)", [id, data.name, data.productionMethod]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.name !== undefined) {
            fields.push("name = ?");
            values.push(changes.name);
        }
        if (changes.productionMethod !== undefined) {
            fields.push("production_method = ?");
            values.push(changes.productionMethod);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE factory_departments SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        await connection_1.pool.query("UPDATE factory_departments SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    }
}
exports.MySqlFactoryDepartmentRepository = MySqlFactoryDepartmentRepository;
//# sourceMappingURL=MySqlFactoryDepartmentRepository.js.map