import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { EntryFileKind, FactoryProductionEntry, FactoryProductionEntryWithContext } from "../../domain/entities/FactoryProductionEntry";
import { CreateEntryData, IFactoryProductionEntryRepository, ListEntriesParams, UpdateEntryData } from "../../domain/repositories/IFactoryProductionEntryRepository";

function mapRow(row: any): FactoryProductionEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    shiftId: row.shift_id,
    factoryDepartmentId: row.factory_department_id,
    orderReference: row.order_reference,
    productionMethod: row.production_method,
    skuCode: row.sku_code,
    componentName: row.component_name,
    targetQty: row.target_qty === null ? null : Number(row.target_qty),
    actualQty: row.actual_qty === null ? null : Number(row.actual_qty),
    targetCbm: row.target_cbm === null ? null : Number(row.target_cbm),
    actualCbm: row.actual_cbm === null ? null : Number(row.actual_cbm),
    targetLabourHours: row.target_labour_hours === null ? null : Number(row.target_labour_hours),
    actualLabourHours: row.actual_labour_hours === null ? null : Number(row.actual_labour_hours),
    delayMinutes: row.delay_minutes,
    delayReason: row.delay_reason,
    rejectionQty: Number(row.rejection_qty),
    reworkQty: Number(row.rework_qty),
    supervisorId: row.supervisor_id,
    contractorId: row.contractor_id,
    remarks: row.remarks,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const WITH_CONTEXT_SELECT = `
  SELECT fpe.*, fd.name AS department_name, s.name AS shift_name,
         sup.full_name AS supervisor_name, c.name AS contractor_name, rev.full_name AS reviewed_by_name
  FROM factory_production_entries fpe
  JOIN departments fd ON fd.id = fpe.factory_department_id
  JOIN shifts s ON s.id = fpe.shift_id
  JOIN employees sup ON sup.id = fpe.supervisor_id
  LEFT JOIN contractors c ON c.id = fpe.contractor_id
  LEFT JOIN employees rev ON rev.id = fpe.reviewed_by
`;

export class MySqlFactoryProductionEntryRepository implements IFactoryProductionEntryRepository {
  private async attachFiles(entries: FactoryProductionEntryWithContext[]): Promise<FactoryProductionEntryWithContext[]> {
    if (entries.length === 0) return entries;
    const ids = entries.map((e) => e.id);
    const placeholders = ids.map(() => "?").join(",");
    const [fileRows] = await pool.query<any[]>(`SELECT * FROM factory_production_entry_files WHERE entry_id IN (${placeholders})`, ids);
    const filesByEntry = new Map<string, any[]>();
    for (const f of fileRows) {
      const list = filesByEntry.get(f.entry_id) ?? [];
      list.push({ id: f.id, entryId: f.entry_id, kind: f.kind, fileName: f.file_name, fileUrl: f.file_url, uploadedBy: f.uploaded_by, uploadedAt: f.uploaded_at });
      filesByEntry.set(f.entry_id, list);
    }
    return entries.map((e) => ({ ...e, files: filesByEntry.get(e.id) ?? [] }));
  }

  async list(params: ListEntriesParams) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["fpe.deleted_at IS NULL"];
    const values: unknown[] = [];
    if (params.factoryDepartmentId) { conditions.push("fpe.factory_department_id = ?"); values.push(params.factoryDepartmentId); }
    if (params.status) { conditions.push("fpe.status = ?"); values.push(params.status); }
    if (params.from) { conditions.push("fpe.entry_date >= ?"); values.push(params.from); }
    if (params.to) { conditions.push("fpe.entry_date <= ?"); values.push(params.to); }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `${WITH_CONTEXT_SELECT} ${whereClause} ORDER BY fpe.entry_date DESC, fpe.created_at DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) as total FROM factory_production_entries fpe ${whereClause}`, values);

    const items = rows.map((r) => ({
      ...mapRow(r), departmentName: r.department_name, shiftName: r.shift_name,
      supervisorName: r.supervisor_name, contractorName: r.contractor_name, reviewedByName: r.reviewed_by_name, files: [],
    }));
    return { items: await this.attachFiles(items), total: countRows[0].total as number };
  }

  async findById(id: string): Promise<FactoryProductionEntry | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM factory_production_entries WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async getWithContext(id: string): Promise<FactoryProductionEntryWithContext | null> {
    const [rows] = await pool.query<any[]>(`${WITH_CONTEXT_SELECT} WHERE fpe.id = ? AND fpe.deleted_at IS NULL`, [id]);
    if (!rows[0]) return null;
    const r = rows[0];
    const item = {
      ...mapRow(r), departmentName: r.department_name, shiftName: r.shift_name,
      supervisorName: r.supervisor_name, contractorName: r.contractor_name, reviewedByName: r.reviewed_by_name, files: [],
    };
    return (await this.attachFiles([item]))[0];
  }

  async create(data: CreateEntryData): Promise<FactoryProductionEntry> {
    const id = data.id || uuid();
    await pool.query(
      `INSERT INTO factory_production_entries
         (id, entry_date, shift_id, factory_department_id, order_reference, production_method, sku_code, component_name,
          target_qty, actual_qty, target_cbm, actual_cbm, target_labour_hours, actual_labour_hours,
          delay_minutes, delay_reason, rejection_qty, rework_qty, supervisor_id, contractor_id, remarks, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.entryDate, data.shiftId, data.factoryDepartmentId, data.orderReference ?? null, data.productionMethod,
        data.skuCode ?? null, data.componentName ?? null,
        data.targetQty ?? null, data.actualQty ?? null, data.targetCbm ?? null, data.actualCbm ?? null,
        data.targetLabourHours ?? null, data.actualLabourHours ?? null,
        data.delayMinutes ?? 0, data.delayReason ?? null, data.rejectionQty ?? 0, data.reworkQty ?? 0,
        data.supervisorId, data.contractorId ?? null, data.remarks ?? null, data.submittedBy,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: UpdateEntryData): Promise<FactoryProductionEntry> {
    const fieldMap: Record<string, string> = {
      orderReference: "order_reference", targetQty: "target_qty", actualQty: "actual_qty",
      targetCbm: "target_cbm", actualCbm: "actual_cbm", targetLabourHours: "target_labour_hours",
      actualLabourHours: "actual_labour_hours", delayMinutes: "delay_minutes", delayReason: "delay_reason",
      rejectionQty: "rejection_qty", reworkQty: "rework_qty", contractorId: "contractor_id", remarks: "remarks",
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (changes as any)[key];
      if (value !== undefined) { fields.push(`${column} = ?`); values.push(value); }
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE factory_production_entries SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async approve(id: string, reviewedBy: string): Promise<FactoryProductionEntry> {
    await pool.query(
      "UPDATE factory_production_entries SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL WHERE id = ?",
      [reviewedBy, id]
    );
    return (await this.findById(id))!;
  }

  async reject(id: string, reviewedBy: string, reason: string): Promise<FactoryProductionEntry> {
    await pool.query(
      "UPDATE factory_production_entries SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
      [reviewedBy, reason, id]
    );
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE factory_production_entries SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async addFile(entryId: string, kind: EntryFileKind, fileName: string, fileUrl: string, uploadedBy: string): Promise<void> {
    await pool.query(
      "INSERT INTO factory_production_entry_files (id, entry_id, kind, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [uuid(), entryId, kind, fileName, fileUrl, uploadedBy]
    );
  }
}
