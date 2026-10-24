import { pool } from "../../../../infrastructure/database/mysql/connection";
import { DprEntry, DprEntryItem, DprEntryWithContext } from "../../domain/entities/DprEntry";
import {
  IDprEntryRepository,
  CreateDprEntryData,
  UpdateDprEntryData,
  ListDprEntriesParams,
  CreateDprItemData,
} from "../../domain/repositories/IDprEntryRepository";

function mapRow(row: any): DprEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    shiftId: row.shift_id,
    factoryDepartmentId: row.factory_department_id,
    supervisorId: row.supervisor_id,
    hodId: row.hod_id,
    totalTarget: Number(row.total_target),
    uom: row.uom,
    totalAchievement: Number(row.total_achievement),
    totalRework: Number(row.total_rework),
    totalOperator: row.total_operator,
    totalHelper: row.total_helper,
    totalContractor: row.total_contractor,
    manpowerDepartmentId: row.manpower_department_id,
    submittedBy: row.submitted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapItemRow(row: any): DprEntryItem {
  return {
    id: row.id,
    dprEntryId: row.dpr_entry_id,
    aliasName: row.alias_name,
    productCode: row.product_code,
    woodType: row.wood_type,
    orderQty: Number(row.order_qty),
    okQty: Number(row.ok_qty),
    reworkQty: Number(row.rework_qty),
    uom: row.uom,
    qtyAsPerUom: row.qty_as_per_uom === null ? null : Number(row.qty_as_per_uom),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

const WITH_CONTEXT_SELECT = `
  SELECT d.*, fd.name AS department_name, s.name AS shift_name, e.full_name AS supervisor_name,
         mfd.name AS manpower_department_name
  FROM dpr_entries d
  JOIN departments fd ON fd.id = d.factory_department_id
  JOIN shifts s ON s.id = d.shift_id
  JOIN employees e ON e.id = d.supervisor_id
  LEFT JOIN departments mfd ON mfd.id = d.manpower_department_id
`;

export class MySqlDprEntryRepository implements IDprEntryRepository {
  private async attachItems(entries: DprEntryWithContext[]): Promise<DprEntryWithContext[]> {
    if (entries.length === 0) return entries;
    const ids = entries.map((e) => e.id);
    const placeholders = ids.map(() => "?").join(",");
    const [itemRows] = await pool.query<any[]>(
      `SELECT * FROM dpr_entry_items WHERE dpr_entry_id IN (${placeholders}) ORDER BY sort_order`,
      ids
    );
    const itemsByEntry = new Map<string, DprEntryItem[]>();
    for (const row of itemRows) {
      const list = itemsByEntry.get(row.dpr_entry_id) ?? [];
      list.push(mapItemRow(row));
      itemsByEntry.set(row.dpr_entry_id, list);
    }
    return entries.map((e) => ({ ...e, items: itemsByEntry.get(e.id) ?? [] }));
  }

  async list(params: ListDprEntriesParams) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["d.deleted_at IS NULL"];
    const values: unknown[] = [];
    if (params.entryDate) {
      conditions.push("d.entry_date = ?");
      values.push(params.entryDate);
    }
    if (params.factoryDepartmentId) {
      conditions.push("d.factory_department_id = ?");
      values.push(params.factoryDepartmentId);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `${WITH_CONTEXT_SELECT} ${whereClause} ORDER BY d.entry_date DESC, d.created_at DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM dpr_entries d ${whereClause}`,
      values
    );

    const items = rows.map((r) => ({
      ...mapRow(r),
      departmentName: r.department_name,
      shiftName: r.shift_name,
      supervisorName: r.supervisor_name,
      manpowerDepartmentName: r.manpower_department_name,
      items: [] as DprEntryItem[],
    }));

    return { items: await this.attachItems(items), total: countRows[0].total as number };
  }

  async findById(id: string): Promise<DprEntry | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM dpr_entries WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async getWithContext(id: string): Promise<DprEntryWithContext | null> {
    const [rows] = await pool.query<any[]>(
      `${WITH_CONTEXT_SELECT} WHERE d.id = ? AND d.deleted_at IS NULL`,
      [id]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    const item: DprEntryWithContext = {
      ...mapRow(r),
      departmentName: r.department_name,
      shiftName: r.shift_name,
      supervisorName: r.supervisor_name,
      manpowerDepartmentName: r.manpower_department_name,
      items: [],
    };
    return (await this.attachItems([item]))[0];
  }

  async create(data: CreateDprEntryData): Promise<DprEntry> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO dpr_entries
          (id, entry_date, shift_id, factory_department_id, supervisor_id, hod_id,
           total_target, uom, total_achievement, total_rework,
           total_operator, total_helper, total_contractor, manpower_department_id, submitted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.entryDate, data.shiftId, data.factoryDepartmentId, data.supervisorId, data.hodId ?? null,
          data.totalTarget, data.uom, data.totalAchievement, data.totalRework,
          data.totalOperator, data.totalHelper, data.totalContractor, data.manpowerDepartmentId ?? null, data.submittedBy,
        ]
      );

      if (data.items.length > 0) {
        const itemValues = data.items.map((item) => [
          item.id, data.id, item.aliasName, item.productCode, item.woodType ?? null,
          item.orderQty, item.okQty, item.reworkQty, item.uom,
          item.qtyAsPerUom, item.sortOrder,
        ]);
        const placeholders = itemValues.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        await conn.query(
          `INSERT INTO dpr_entry_items
            (id, dpr_entry_id, alias_name, product_code, wood_type, order_qty, ok_qty, rework_qty, uom, qty_as_per_uom, sort_order)
           VALUES ${placeholders}`,
          itemValues.flat()
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return (await this.findById(data.id))!;
  }

  async update(id: string, changes: UpdateDprEntryData & { totalAchievement?: number; totalRework?: number }): Promise<DprEntry> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const fieldMap: Record<string, string> = {
        entryDate: "entry_date",
        shiftId: "shift_id",
        factoryDepartmentId: "factory_department_id",
        supervisorId: "supervisor_id",
        hodId: "hod_id",
        totalTarget: "total_target",
        uom: "uom",
        totalAchievement: "total_achievement",
        totalRework: "total_rework",
        totalOperator: "total_operator",
        totalHelper: "total_helper",
        totalContractor: "total_contractor",
        manpowerDepartmentId: "manpower_department_id",
      };
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const [key, column] of Object.entries(fieldMap)) {
        const value = (changes as any)[key];
        if (value !== undefined) {
          fields.push(`${column} = ?`);
          values.push(value);
        }
      }
      if (fields.length > 0) {
        values.push(id);
        await conn.query(
          `UPDATE dpr_entries SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }

      // Replace items if provided
      if (changes.items) {
        await conn.query("DELETE FROM dpr_entry_items WHERE dpr_entry_id = ?", [id]);
        if (changes.items.length > 0) {
          const itemValues = changes.items.map((item) => [
            item.id, id, item.aliasName ?? null, item.productCode ?? null, item.woodType ?? null,
            item.orderQty, item.okQty, item.reworkQty, item.uom,
            item.qtyAsPerUom ?? null, item.sortOrder,
          ]);
          const placeholders = itemValues.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
          await conn.query(
            `INSERT INTO dpr_entry_items
              (id, dpr_entry_id, alias_name, product_code, wood_type, order_qty, ok_qty, rework_qty, uom, qty_as_per_uom, sort_order)
             VALUES ${placeholders}`,
            itemValues.flat()
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE dpr_entries SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async updateItem(dprEntryId: string, itemId: string, data: any): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const itemFields: string[] = [];
      const itemVals: any[] = [];
      if (data.aliasName !== undefined) { itemFields.push("alias_name = ?"); itemVals.push(data.aliasName); }
      if (data.productCode !== undefined) { itemFields.push("product_code = ?"); itemVals.push(data.productCode); }
      if (data.woodType !== undefined) { itemFields.push("wood_type = ?"); itemVals.push(data.woodType); }
      if (data.orderQty !== undefined) { itemFields.push("order_qty = ?"); itemVals.push(Number(data.orderQty) || 0); }
      if (data.okQty !== undefined) { itemFields.push("ok_qty = ?"); itemVals.push(Number(data.okQty) || 0); }
      if (data.reworkQty !== undefined) { itemFields.push("rework_qty = ?"); itemVals.push(Number(data.reworkQty) || 0); }
      if (data.uom !== undefined) { itemFields.push("uom = ?"); itemVals.push(data.uom); }
      if (data.qtyAsPerUom !== undefined) { itemFields.push("qty_as_per_uom = ?"); itemVals.push(data.qtyAsPerUom !== null ? Number(data.qtyAsPerUom) : null); }

      if (itemFields.length > 0) {
        itemVals.push(itemId, dprEntryId);
        await conn.query(`UPDATE dpr_entry_items SET ${itemFields.join(", ")} WHERE id = ? AND dpr_entry_id = ?`, itemVals);
      }

      // If header fields updated
      const headerFields: string[] = [];
      const headerVals: any[] = [];
      if (data.entryDate !== undefined) { headerFields.push("entry_date = ?"); headerVals.push(data.entryDate); }
      if (data.shiftId !== undefined) { headerFields.push("shift_id = ?"); headerVals.push(data.shiftId); }
      if (data.supervisorId !== undefined) { headerFields.push("supervisor_id = ?"); headerVals.push(data.supervisorId); }
      if (data.hodId !== undefined) { headerFields.push("hod_id = ?"); headerVals.push(data.hodId); }

      if (headerFields.length > 0) {
        headerVals.push(dprEntryId);
        await conn.query(`UPDATE dpr_entries SET ${headerFields.join(", ")} WHERE id = ?`, headerVals);
      }

      // Recalculate totals for dpr_entries
      await conn.query(`
        UPDATE dpr_entries de
        SET
          total_achievement = (SELECT COALESCE(SUM(qty_as_per_uom), 0) FROM dpr_entry_items WHERE dpr_entry_id = de.id),
          total_rework = (SELECT COALESCE(SUM(rework_qty), 0) FROM dpr_entry_items WHERE dpr_entry_id = de.id)
        WHERE de.id = ?
      `, [dprEntryId]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async deleteItem(dprEntryId: string, itemId: string): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM dpr_entry_items WHERE id = ? AND dpr_entry_id = ?", [itemId, dprEntryId]);

      const [rows] = await conn.query<any[]>("SELECT COUNT(*) as cnt FROM dpr_entry_items WHERE dpr_entry_id = ?", [dprEntryId]);
      if (rows[0]?.cnt === 0) {
        await conn.query("UPDATE dpr_entries SET deleted_at = NOW() WHERE id = ?", [dprEntryId]);
      } else {
        await conn.query(`
          UPDATE dpr_entries de
          SET
            total_achievement = (SELECT COALESCE(SUM(qty_as_per_uom), 0) FROM dpr_entry_items WHERE dpr_entry_id = de.id),
            total_rework = (SELECT COALESCE(SUM(rework_qty), 0) FROM dpr_entry_items WHERE dpr_entry_id = de.id)
          WHERE de.id = ?
        `, [dprEntryId]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
