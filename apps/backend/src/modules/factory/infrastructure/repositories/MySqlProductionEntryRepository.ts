import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ProductionEntry, ProductionEntryWithRelations } from "../../domain/entities/ProductionEntry";
import {
  CreateProductionEntryData,
  IProductionEntryRepository,
  UpdateProductionEntryData,
} from "../../domain/repositories/IProductionEntryRepository";

function mapRow(row: any): ProductionEntry {
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

function mapRowWithRelations(row: any): ProductionEntryWithRelations {
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

export class MySqlProductionEntryRepository implements IProductionEntryRepository {
  async findById(id: string): Promise<ProductionEntry | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM production_entries WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findExisting(employeeId: string, lineId: string, shiftId: string, entryDate: string): Promise<ProductionEntry | null> {
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM production_entries
       WHERE employee_id = ? AND line_id = ? AND shift_id = ? AND entry_date = ? AND deleted_at IS NULL`,
      [employeeId, lineId, shiftId, entryDate]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async listForEmployee(employeeId: string, params?: { from?: string; to?: string }): Promise<ProductionEntryWithRelations[]> {
    const conditions = ["pe.employee_id = ?", "pe.deleted_at IS NULL"];
    const values: unknown[] = [employeeId];
    if (params?.from) { conditions.push("pe.entry_date >= ?"); values.push(params.from); }
    if (params?.to) { conditions.push("pe.entry_date <= ?"); values.push(params.to); }

    const [rows] = await pool.query<any[]>(
      `${SELECT_WITH_RELATIONS} WHERE ${conditions.join(" AND ")} ORDER BY pe.entry_date DESC`,
      values
    );
    return rows.map(mapRowWithRelations);
  }

  async listForLineShiftDate(lineId: string, shiftId: string, entryDate: string): Promise<ProductionEntryWithRelations[]> {
    const [rows] = await pool.query<any[]>(
      `${SELECT_WITH_RELATIONS} WHERE pe.line_id = ? AND pe.shift_id = ? AND pe.entry_date = ? AND pe.deleted_at IS NULL
       ORDER BY e.full_name ASC`,
      [lineId, shiftId, entryDate]
    );
    return rows.map(mapRowWithRelations);
  }

  async create(data: CreateProductionEntryData): Promise<ProductionEntry> {
    const id = data.id || uuid();
    await pool.query(
      `INSERT INTO production_entries (id, employee_id, line_id, shift_id, entry_date, quantity_produced, target_quantity, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.employeeId, data.lineId, data.shiftId, data.entryDate,
        data.quantityProduced, data.targetQuantity ?? null, data.notes ?? null, data.recordedBy,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: UpdateProductionEntryData): Promise<ProductionEntry> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.quantityProduced !== undefined) { fields.push("quantity_produced = ?"); values.push(changes.quantityProduced); }
    if (changes.targetQuantity !== undefined) { fields.push("target_quantity = ?"); values.push(changes.targetQuantity); }
    if (changes.notes !== undefined) { fields.push("notes = ?"); values.push(changes.notes); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE production_entries SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE production_entries SET deleted_at = NOW() WHERE id = ?", [id]);
  }
}
