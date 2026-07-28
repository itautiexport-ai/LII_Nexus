"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlDesignationRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
function mapRow(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
class MySqlDesignationRepository {
    async list() {
        const [rows] = await connection_1.pool.query("SELECT * FROM designations WHERE deleted_at IS NULL ORDER BY title ASC");
        return rows.map(mapRow);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM designations WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findByTitle(title) {
        const [rows] = await connection_1.pool.query("SELECT * FROM designations WHERE title = ? AND deleted_at IS NULL", [title]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        try {
            await connection_1.pool.query("INSERT INTO designations (id, title, description) VALUES (?, ?, ?)", [
                id, data.title, data.description ?? null,
            ]);
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                throw new DomainError_1.ConflictError("A designation with this title already exists.");
            throw err;
        }
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.title !== undefined) {
            fields.push("title = ?");
            values.push(changes.title);
        }
        if (changes.description !== undefined) {
            fields.push("description = ?");
            values.push(changes.description);
        }
        if (fields.length > 0) {
            values.push(id);
            try {
                await connection_1.pool.query(`UPDATE designations SET ${fields.join(", ")} WHERE id = ?`, values);
            }
            catch (err) {
                if (err.code === "ER_DUP_ENTRY")
                    throw new DomainError_1.ConflictError("A designation with this title already exists.");
                throw err;
            }
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        try {
            await connection_1.pool.query("DELETE FROM designations WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE designations SET deleted_at = NOW(), title = CONCAT(title, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
            }
            else
                throw err;
        }
    }
}
exports.MySqlDesignationRepository = MySqlDesignationRepository;
//# sourceMappingURL=MySqlDesignationRepository.js.map