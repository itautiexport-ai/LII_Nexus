"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlProductionEntryRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
    return {
        id: row.id,
        employeeId: row.employee_id,
        lineId: row.line_id,
        shiftId: row.shift_id,
        entryDate: row.entry_date,
        quantityProduced: Number(row.quantity_produced),
        targetQuantity: row.target_quantity === null ? null : Number(row.target_quantity),
        notes: row.notes,
        recordedBy: row.recorded_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
function mapRowWithRelations(row) {
    return {
        ...mapRow(row),
        employeeName: row.employee_name,
        employeeCode: row.employee_code,
        lineName: row.line_name,
        shiftName: row.shift_name,
    };
}
const SELECT_WITH_RELATIONS = `
  SELECT pe.*, e.full_name AS employee_name, e.employee_code AS employee_code,
         l.name AS line_name, s.name AS shift_name
  FROM production_entries pe
  JOIN employees e ON e.id = pe.employee_id
  JOIN production_lines l ON l.id = pe.line_id
  JOIN shifts s ON s.id = pe.shift_id
`;
class MySqlProductionEntryRepository {
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM production_entries WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async findExisting(employeeId, lineId, shiftId, entryDate) {
        const [rows] = await connection_1.pool.query(`SELECT * FROM production_entries
       WHERE employee_id = ? AND line_id = ? AND shift_id = ? AND entry_date = ? AND deleted_at IS NULL`, [employeeId, lineId, shiftId, entryDate]);
        return rows[0] ? mapRow(rows[0]) : null;
    }
    async listForEmployee(employeeId, params) {
        const conditions = ["pe.employee_id = ?", "pe.deleted_at IS NULL"];
        const values = [employeeId];
        if (params?.from) {
            conditions.push("pe.entry_date >= ?");
            values.push(params.from);
        }
        if (params?.to) {
            conditions.push("pe.entry_date <= ?");
            values.push(params.to);
        }
        const [rows] = await connection_1.pool.query(`${SELECT_WITH_RELATIONS} WHERE ${conditions.join(" AND ")} ORDER BY pe.entry_date DESC`, values);
        return rows.map(mapRowWithRelations);
    }
    async listForLineShiftDate(lineId, shiftId, entryDate) {
        const [rows] = await connection_1.pool.query(`${SELECT_WITH_RELATIONS} WHERE pe.line_id = ? AND pe.shift_id = ? AND pe.entry_date = ? AND pe.deleted_at IS NULL
       ORDER BY e.full_name ASC`, [lineId, shiftId, entryDate]);
        return rows.map(mapRowWithRelations);
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO production_entries (id, employee_id, line_id, shift_id, entry_date, quantity_produced, target_quantity, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, data.employeeId, data.lineId, data.shiftId, data.entryDate,
            data.quantityProduced, data.targetQuantity ?? null, data.notes ?? null, data.recordedBy,
        ]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.quantityProduced !== undefined) {
            fields.push("quantity_produced = ?");
            values.push(changes.quantityProduced);
        }
        if (changes.targetQuantity !== undefined) {
            fields.push("target_quantity = ?");
            values.push(changes.targetQuantity);
        }
        if (changes.notes !== undefined) {
            fields.push("notes = ?");
            values.push(changes.notes);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE production_entries SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async softDelete(id) {
        await connection_1.pool.query("UPDATE production_entries SET deleted_at = NOW() WHERE id = ?", [id]);
    }
}
exports.MySqlProductionEntryRepository = MySqlProductionEntryRepository;
//# sourceMappingURL=MySqlProductionEntryRepository.js.map