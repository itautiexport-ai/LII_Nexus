"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlProductionLineRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
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
class MySqlProductionLineRepository {
    async list() {
        const [rows] = await connection_1.pool.query("SELECT * FROM production_lines WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows.map(mapRow);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM production_lines WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByName(name) {
        const [rows] = await connection_1.pool.query("SELECT * FROM production_lines WHERE name = ? AND deleted_at IS NULL", [name]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO production_lines (id, name, code, description) VALUES (?, ?, ?, ?)", [
            id, data.name, data.code ?? null, data.description ?? null,
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
            await connection_1.pool.query(`UPDATE production_lines SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        await connection_1.pool.query("UPDATE production_lines SET deleted_at = NOW() WHERE id = ?", [id]);
    }
}
exports.MySqlProductionLineRepository = MySqlProductionLineRepository;
//# sourceMappingURL=MySqlProductionLineRepository.js.map