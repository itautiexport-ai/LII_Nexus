import { pool } from "../../../infrastructure/database/mysql/connection";
import { CostEstimation, CostEstimationItem, CostRateMaster } from "../domain/CostEstimation";
import { v4 as uuidv4 } from "uuid";

export class MySqlCostingRepository {
  async generateEstimationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EST-${year}-`;
    const [rows]: any = await pool.query(
      `SELECT estimation_number FROM cost_estimations WHERE estimation_number LIKE ? ORDER BY created_at DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows && rows.length > 0) {
      const lastNum = rows[0].estimation_number;
      const sequence = parseInt(lastNum.replace(prefix, ""), 10);
      const nextSeq = isNaN(sequence) ? 1 : sequence + 1;
      return `${prefix}${String(nextSeq).padStart(4, "0")}`;
    }
    return `${prefix}0001`;
  }

  async findAllEstimations(search?: string, status?: string): Promise<CostEstimation[]> {
    let sql = `SELECT * FROM cost_estimations WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== "ALL") {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (title LIKE ? OR client_name LIKE ? OR estimation_number LIKE ? OR product_code LIKE ? OR product_name LIKE ? OR wood_type LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += ` ORDER BY created_at DESC`;
    const [rows]: any = await pool.query(sql, params);
    return rows as CostEstimation[];
  }

  async findEstimationById(id: string): Promise<CostEstimation | null> {
    const [rows]: any = await pool.query(`SELECT * FROM cost_estimations WHERE id = ?`, [id]);
    if (!rows || rows.length === 0) return null;

    const estimation = rows[0] as CostEstimation;
    const [itemRows]: any = await pool.query(
      `SELECT * FROM cost_estimation_items WHERE estimation_id = ? ORDER BY category, id`,
      [id]
    );
    estimation.items = itemRows as CostEstimationItem[];
    return estimation;
  }

  async createEstimation(estimation: CostEstimation, items: CostEstimationItem[]): Promise<CostEstimation> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO cost_estimations (
          id, estimation_number, title, product_code, product_name, overall_size, wood_type, client_name, crm_lead_id, status, currency, exchange_rate,
          total_material_cost, total_labor_cost, total_overhead_cost, total_finishing_cost,
          total_packaging_cost, subtotal_cost, margin_percentage, margin_amount,
          tax_percentage, tax_amount, final_price, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          estimation.id,
          estimation.estimation_number,
          estimation.title,
          estimation.product_code || null,
          estimation.product_name || null,
          estimation.overall_size || null,
          estimation.wood_type || null,
          estimation.client_name || null,
          estimation.crm_lead_id || null,
          estimation.status || 'Draft',
          estimation.currency || 'INR',
          estimation.exchange_rate || 1.0,
          estimation.total_material_cost || 0,
          estimation.total_labor_cost || 0,
          estimation.total_overhead_cost || 0,
          estimation.total_finishing_cost || 0,
          estimation.total_packaging_cost || 0,
          estimation.subtotal_cost || 0,
          estimation.margin_percentage || 20,
          estimation.margin_amount || 0,
          estimation.tax_percentage || 18,
          estimation.tax_amount || 0,
          estimation.final_price || 0,
          estimation.notes || null,
          estimation.created_by || null,
        ]
      );

      for (const item of items) {
        const itemId = item.id || uuidv4();
        await conn.query(
          `INSERT INTO cost_estimation_items (
            id, estimation_id, category, item_name, specification, quantity, unit_of_measure, unit_cost, total_cost, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            estimation.id,
            item.category,
            item.item_name,
            item.specification || null,
            item.quantity || 1,
            item.unit_of_measure || 'Pcs',
            item.unit_cost || 0,
            item.total_cost || 0,
            item.remarks || null,
          ]
        );
      }

      await conn.commit();
      return (await this.findEstimationById(estimation.id))!;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateEstimation(id: string, estimation: Partial<CostEstimation>, items?: CostEstimationItem[]): Promise<CostEstimation | null> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE cost_estimations SET
          title = COALESCE(?, title),
          product_code = COALESCE(?, product_code),
          product_name = COALESCE(?, product_name),
          overall_size = COALESCE(?, overall_size),
          wood_type = COALESCE(?, wood_type),
          client_name = COALESCE(?, client_name),
          crm_lead_id = COALESCE(?, crm_lead_id),
          status = COALESCE(?, status),
          currency = COALESCE(?, currency),
          exchange_rate = COALESCE(?, exchange_rate),
          total_material_cost = COALESCE(?, total_material_cost),
          total_labor_cost = COALESCE(?, total_labor_cost),
          total_overhead_cost = COALESCE(?, total_overhead_cost),
          total_finishing_cost = COALESCE(?, total_finishing_cost),
          total_packaging_cost = COALESCE(?, total_packaging_cost),
          subtotal_cost = COALESCE(?, subtotal_cost),
          margin_percentage = COALESCE(?, margin_percentage),
          margin_amount = COALESCE(?, margin_amount),
          tax_percentage = COALESCE(?, tax_percentage),
          tax_amount = COALESCE(?, tax_amount),
          final_price = COALESCE(?, final_price),
          notes = COALESCE(?, notes)
        WHERE id = ?`,
        [
          estimation.title ?? null,
          estimation.product_code ?? null,
          estimation.product_name ?? null,
          estimation.overall_size ?? null,
          estimation.wood_type ?? null,
          estimation.client_name ?? null,
          estimation.crm_lead_id ?? null,
          estimation.status ?? null,
          estimation.currency ?? null,
          estimation.exchange_rate ?? null,
          estimation.total_material_cost ?? null,
          estimation.total_labor_cost ?? null,
          estimation.total_overhead_cost ?? null,
          estimation.total_finishing_cost ?? null,
          estimation.total_packaging_cost ?? null,
          estimation.subtotal_cost ?? null,
          estimation.margin_percentage ?? null,
          estimation.margin_amount ?? null,
          estimation.tax_percentage ?? null,
          estimation.tax_amount ?? null,
          estimation.final_price ?? null,
          estimation.notes ?? null,
          id
        ]
      );

      if (items) {
        await conn.query(`DELETE FROM cost_estimation_items WHERE estimation_id = ?`, [id]);
        for (const item of items) {
          const itemId = item.id || uuidv4();
          await conn.query(
            `INSERT INTO cost_estimation_items (
              id, estimation_id, category, item_name, specification, quantity, unit_of_measure, unit_cost, total_cost, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.category,
              item.item_name,
              item.specification || null,
              item.quantity || 1,
              item.unit_of_measure || 'Pcs',
              item.unit_cost || 0,
              item.total_cost || 0,
              item.remarks || null,
            ]
          );
        }
      }

      await conn.commit();
      return await this.findEstimationById(id);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async deleteEstimation(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM cost_estimations WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Cost Rates Master methods
  async findAllRates(): Promise<CostRateMaster[]> {
    const [rows]: any = await pool.query(`SELECT * FROM cost_rates_master ORDER BY category, item_name`);
    return rows as CostRateMaster[];
  }

  async saveRate(rate: CostRateMaster): Promise<CostRateMaster> {
    await pool.query(
      `INSERT INTO cost_rates_master (id, item_name, category, unit_of_measure, rate, effective_date)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       item_name = VALUES(item_name),
       category = VALUES(category),
       unit_of_measure = VALUES(unit_of_measure),
       rate = VALUES(rate),
       effective_date = VALUES(effective_date)`,
      [
        rate.id || uuidv4(),
        rate.item_name,
        rate.category,
        rate.unit_of_measure || 'Pcs',
        rate.rate || 0,
        rate.effective_date || null
      ]
    );
    const [rows]: any = await pool.query(`SELECT * FROM cost_rates_master WHERE item_name = ? AND category = ?`, [rate.item_name, rate.category]);
    return rows[0] as CostRateMaster;
  }

  async deleteRate(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM cost_rates_master WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async getSummary(): Promise<any> {
    const [totalRows]: any = await pool.query(`SELECT COUNT(*) as total_count, COALESCE(SUM(final_price), 0) as total_value FROM cost_estimations`);
    const [statusRows]: any = await pool.query(`SELECT status, COUNT(*) as count, COALESCE(SUM(final_price), 0) as value FROM cost_estimations GROUP BY status`);
    
    return {
      overview: totalRows[0],
      byStatus: statusRows
    };
  }
}
