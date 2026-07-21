"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KraRepository = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const uuid_1 = require("uuid");
class KraRepository {
    async findAll(departmentId) {
        if (departmentId) {
            const [rows] = await connection_1.pool.query("SELECT * FROM kras WHERE department_id = ? ORDER BY created_at DESC", [departmentId]);
            return rows;
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM kras ORDER BY created_at DESC");
        return rows;
    }
    async create(data) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO kras (id, department_id, designation_id, title, description, attachment_url) VALUES (?, ?, ?, ?, ?, ?)", [id, data.departmentId, data.designationId || null, data.title, data.description || null, data.attachmentUrl || null]);
        const [rows] = await connection_1.pool.query("SELECT * FROM kras WHERE id = ?", [id]);
        return rows[0];
    }
    async delete(id) {
        await connection_1.pool.query("DELETE FROM kras WHERE id = ?", [id]);
    }
}
exports.KraRepository = KraRepository;
//# sourceMappingURL=KraRepository.js.map