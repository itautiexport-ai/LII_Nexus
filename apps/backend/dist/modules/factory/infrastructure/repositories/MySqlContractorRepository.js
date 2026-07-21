"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlContractorRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
    return {
        id: row.id,
        name: row.name,
        contactPerson: row.contact_person,
        phone: row.phone,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
class MySqlContractorRepository {
    async list(status) {
        const conditions = ["deleted_at IS NULL"];
        const values = [];
        if (status) {
            conditions.push("status = ?");
            values.push(status);
        }
        const [rows] = await connection_1.pool.query(`SELECT * FROM contractors WHERE ${conditions.join(" AND ")} ORDER BY name ASC`, values);
        return rows.map(mapRow);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM contractors WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO contractors (id, name, contact_person, phone, email) VALUES (?, ?, ?, ?, ?)", [id, data.name, data.contactPerson ?? null, data.phone ?? null, data.email ?? null]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.name !== undefined) {
            fields.push("name = ?");
            values.push(changes.name);
        }
        if (changes.contactPerson !== undefined) {
            fields.push("contact_person = ?");
            values.push(changes.contactPerson);
        }
        if (changes.phone !== undefined) {
            fields.push("phone = ?");
            values.push(changes.phone);
        }
        if (changes.email !== undefined) {
            fields.push("email = ?");
            values.push(changes.email);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE contractors SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        await connection_1.pool.query("UPDATE contractors SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    }
}
exports.MySqlContractorRepository = MySqlContractorRepository;
//# sourceMappingURL=MySqlContractorRepository.js.map