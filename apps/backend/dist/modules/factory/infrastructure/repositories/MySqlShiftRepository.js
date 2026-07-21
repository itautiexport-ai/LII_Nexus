"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlShiftRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
    return {
        id: row.id,
        name: row.name,
        startTime: row.start_time,
        endTime: row.end_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
class MySqlShiftRepository {
    async list() {
        const [rows] = await connection_1.pool.query("SELECT * FROM shifts WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows.map(mapRow);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM shifts WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByName(name) {
        const [rows] = await connection_1.pool.query("SELECT * FROM shifts WHERE name = ? AND deleted_at IS NULL", [name]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO shifts (id, name, start_time, end_time) VALUES (?, ?, ?, ?)", [
            id, data.name, data.startTime ?? null, data.endTime ?? null,
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
        if (changes.startTime !== undefined) {
            fields.push("start_time = ?");
            values.push(changes.startTime);
        }
        if (changes.endTime !== undefined) {
            fields.push("end_time = ?");
            values.push(changes.endTime);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE shifts SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        try {
            await connection_1.pool.query("DELETE FROM shifts WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE shifts SET deleted_at = NOW(), name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
            }
            else
                throw err;
        }
    }
}
exports.MySqlShiftRepository = MySqlShiftRepository;
//# sourceMappingURL=MySqlShiftRepository.js.map