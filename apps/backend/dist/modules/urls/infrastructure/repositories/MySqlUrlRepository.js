"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlUrlRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapUrl(row) {
    return {
        id: row.id,
        title: row.title,
        url: row.url,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
class MySqlUrlRepository {
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO important_urls (id, title, url, created_by) VALUES (?, ?, ?, ?)", [id, data.title, data.url, data.createdBy]);
        const [rows] = await connection_1.pool.query("SELECT * FROM important_urls WHERE id = ?", [id]);
        return mapUrl(rows[0]);
    }
    async list() {
        const [rows] = await connection_1.pool.query("SELECT * FROM important_urls WHERE deleted_at IS NULL ORDER BY created_at DESC");
        return rows.map(mapUrl);
    }
    async remove(id) {
        await connection_1.pool.query("UPDATE important_urls SET deleted_at = NOW() WHERE id = ?", [id]);
    }
}
exports.MySqlUrlRepository = MySqlUrlRepository;
//# sourceMappingURL=MySqlUrlRepository.js.map