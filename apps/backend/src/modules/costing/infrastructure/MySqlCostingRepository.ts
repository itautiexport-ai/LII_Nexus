import { pool } from "../../../infrastructure/database/mysql/connection";
import { CostEstimation, CostEstimationItem, CostRateMaster, CostingRequestBunch, CostingRequestItem } from "../domain/CostEstimation";
import { v4 as uuidv4 } from "uuid";

export class MySqlCostingRepository {
  private schemaEnsured = false;

  private async ensureCostingSchema(): Promise<void> {
    if (this.schemaEnsured) return;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cost_estimations (
        id VARCHAR(36) PRIMARY KEY,
        estimation_number VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        product_code VARCHAR(100) NULL,
        product_name VARCHAR(255) NULL,
        overall_size VARCHAR(255) NULL,
        wood_type VARCHAR(100) NULL,
        client_name VARCHAR(255) NULL,
        crm_lead_id VARCHAR(36) NULL,
        status ENUM('Draft', 'In Review', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft',
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
        total_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_labor_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_overhead_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_finishing_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_packaging_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        subtotal_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
        margin_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
        tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        final_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        notes TEXT NULL,
        created_by VARCHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_estimation_number (estimation_number),
        KEY idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const extraCols: Array<[string, string]> = [
      ["product_code", "VARCHAR(100) NULL AFTER title"],
      ["product_name", "VARCHAR(255) NULL AFTER product_code"],
      ["product_type", "VARCHAR(100) NULL AFTER product_name"],
      ["collection_name", "VARCHAR(150) NULL AFTER product_type"],
      ["type_of_costing", "VARCHAR(100) NULL AFTER collection_name"],
      ["overall_size", "VARCHAR(255) NULL AFTER type_of_costing"],
      ["wood_type", "VARCHAR(100) NULL AFTER overall_size"],
      ["form_data", "LONGTEXT NULL AFTER notes"],
      ["costing_request_item_id", "VARCHAR(36) NULL AFTER form_data"],
    ];
    for (const [colName, colDef] of extraCols) {
      const [cols]: any = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_estimations' AND COLUMN_NAME = ?`,
        [colName]
      );
      if (!Array.isArray(cols) || cols.length === 0) {
        await pool.query(`ALTER TABLE cost_estimations ADD COLUMN ${colName} ${colDef}`);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cost_estimation_items (
        id VARCHAR(36) PRIMARY KEY,
        estimation_id VARCHAR(36) NOT NULL,
        category ENUM('Raw Material', 'Hardware', 'Labor', 'Finishing', 'Packaging', 'Overhead', 'Other') NOT NULL DEFAULT 'Raw Material',
        item_name VARCHAR(255) NOT NULL,
        specification TEXT NULL,
        quantity DECIMAL(12,4) NOT NULL DEFAULT 1.0000,
        unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pcs',
        unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        remarks VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estimation_id) REFERENCES cost_estimations(id) ON DELETE CASCADE,
        KEY idx_estimation_id (estimation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS costing_request_bunches (
        id VARCHAR(36) PRIMARY KEY,
        bunch_code VARCHAR(50) NOT NULL UNIQUE,
        merchant_id VARCHAR(36) NULL,
        merchant_name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NULL,
        notes TEXT NULL,
        priority ENUM('Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
        total_products INT NOT NULL DEFAULT 1,
        status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_bunch_code (bunch_code),
        KEY idx_bunch_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS costing_request_items (
        id VARCHAR(36) PRIMARY KEY,
        bunch_id VARCHAR(36) NOT NULL,
        bunch_code VARCHAR(50) NOT NULL,
        product_code VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(100) NULL,
        collection_name VARCHAR(150) NULL,
        wood_type VARCHAR(100) NULL,
        overall_size VARCHAR(255) NULL,
        client_name VARCHAR(255) NULL,
        description TEXT NULL,
        image_url TEXT NULL,
        priority ENUM('Normal', 'High', 'Urgent') NOT NULL DEFAULT 'Normal',
        stage ENUM('Pending', 'In Progress', 'In Review', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
        estimation_id VARCHAR(36) NULL,
        estimation_number VARCHAR(50) NULL,
        final_price DECIMAL(15,2) NULL,
        merchant_name VARCHAR(255) NOT NULL,
        created_by VARCHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_item_bunch (bunch_id),
        KEY idx_item_bunch_code (bunch_code),
        KEY idx_item_product_code (product_code),
        KEY idx_item_stage (stage),
        KEY idx_item_estimation (estimation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure final_price_usd, buyer_code, costing_code, sample_availability, image_urls, approved_at, target_price, target_currency columns exist
    const [existingItemCols]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'costing_request_items'
         AND COLUMN_NAME IN ('final_price_usd', 'buyer_code', 'costing_code', 'sample_availability', 'image_urls', 'approved_at', 'target_price', 'target_currency')`
    );
    const colSet = new Set((existingItemCols || []).map((r: any) => r.COLUMN_NAME));
    if (!colSet.has('final_price_usd')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN final_price_usd DECIMAL(15,2) NULL AFTER final_price`);
    }
    if (!colSet.has('buyer_code')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN buyer_code VARCHAR(100) NULL AFTER product_code`);
    }
    if (!colSet.has('costing_code')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN costing_code VARCHAR(100) NULL AFTER buyer_code`);
    }
    if (!colSet.has('sample_availability')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN sample_availability VARCHAR(50) NOT NULL DEFAULT 'Not Available' AFTER collection_name`);
    }
    if (!colSet.has('image_urls')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN image_urls LONGTEXT NULL AFTER image_url`);
    }
    if (!colSet.has('approved_at')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN approved_at TIMESTAMP NULL AFTER stage`);
    }
    if (!colSet.has('target_price')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN target_price DECIMAL(15,2) NULL AFTER client_name`);
    }
    if (!colSet.has('target_currency')) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN target_currency VARCHAR(20) NULL DEFAULT 'USD' AFTER target_price`);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cost_rates_master (
        id VARCHAR(36) PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pcs',
        rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        effective_date DATE NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_cost_rate (item_name, category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(
      `INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
        (UUID(), 'Menu: Costing & Estimation', 'Access to Costing & Estimation module', 0),
        (UUID(), 'Menu: Costing & Estimation -> Dashboard', 'Access to Costing Dashboard', 0),
        (UUID(), 'Menu: Costing & Estimation -> Costing Request Center', 'Access to Costing Request Center under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> List of Costing', 'Access to List of Costing under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> List of Costing -> SKU Wise Costing', 'Access to SKU Wise Costing under List of Costing', 0),
        (UUID(), 'Menu: Costing & Estimation -> List of Costing -> Merchant Wise Details', 'Access to Merchant Wise Details under List of Costing', 0),
        (UUID(), 'Menu: Costing & Estimation -> Costing Requests (Products)', 'Access to Costing Requests (Products) under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> Costing Requests (Bunches)', 'Access to Costing Requests (Bunches) under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> Costing Tracker', 'Access to Costing Tracker under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> Buyer''s Quote History', 'Access to Buyer''s Quote History under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> New Costing Sheet', 'Access to New Costing Sheet under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> List of New Costing', 'Access to List of New Costing under Costing & Estimation', 0)`
    );

    this.schemaEnsured = true;
  }

  async generateEstimationNumber(): Promise<string> {
    await this.ensureCostingSchema();
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
    await this.ensureCostingSchema();
    let sql = `SELECT * FROM cost_estimations WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== "ALL") {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (title LIKE ? OR client_name LIKE ? OR estimation_number LIKE ? OR product_code LIKE ? OR product_name LIKE ? OR product_type LIKE ? OR collection_name LIKE ? OR type_of_costing LIKE ? OR wood_type LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term, term, term);
    }

    sql += ` ORDER BY created_at DESC`;
    const [rows]: any = await pool.query(sql, params);
    return rows as CostEstimation[];
  }

  async findEstimationById(id: string): Promise<CostEstimation | null> {
    await this.ensureCostingSchema();
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
    await this.ensureCostingSchema();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO cost_estimations (
          id, estimation_number, title, product_code, product_name, product_type, collection_name, type_of_costing, overall_size, wood_type, client_name, crm_lead_id, status, currency, exchange_rate,
          total_material_cost, total_labor_cost, total_overhead_cost, total_finishing_cost,
          total_packaging_cost, subtotal_cost, margin_percentage, margin_amount,
          tax_percentage, tax_amount, final_price, notes, form_data, costing_request_item_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          estimation.id,
          estimation.estimation_number,
          estimation.title,
          estimation.product_code || null,
          estimation.product_name || null,
          estimation.product_type || null,
          estimation.collection_name || null,
          estimation.type_of_costing || null,
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
          estimation.margin_percentage ?? 26,
          estimation.margin_amount || 0,
          estimation.tax_percentage || 18,
          estimation.tax_amount || 0,
          estimation.final_price || 0,
          estimation.notes || null,
          (estimation as any).form_data || null,
          (estimation as any).costing_request_item_id || null,
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

      // Link to Costing Request Item if provided
      const reqItemId = (estimation as any).costing_request_item_id;
      if (reqItemId) {
        const itemStage = estimation.status === 'Approved' ? 'Approved' : (estimation.status === 'In Review' ? 'In Review' : 'In Progress');
        let usdRate = 86.5;
        try {
          if ((estimation as any).form_data) {
            const parsed = typeof (estimation as any).form_data === 'string' ? JSON.parse((estimation as any).form_data) : (estimation as any).form_data;
            if (parsed.usdExchangeRate) usdRate = Number(parsed.usdExchangeRate) || 86.5;
          }
        } catch (_) {}
        const finalPriceUsd = estimation.final_price ? Number((estimation.final_price / usdRate).toFixed(2)) : null;

        await conn.query(
          `UPDATE costing_request_items SET
            estimation_id = ?,
            estimation_number = ?,
            final_price = ?,
            final_price_usd = ?,
            stage = ?
           WHERE id = ?`,
          [estimation.id, estimation.estimation_number, estimation.final_price || 0, finalPriceUsd, itemStage, reqItemId]
        );
        // Also update parent bunch status
        const [itemRows]: any = await conn.query(`SELECT bunch_id FROM costing_request_items WHERE id = ?`, [reqItemId]);
        if (itemRows && itemRows.length > 0) {
          await this.syncBunchStatusInternal(conn, itemRows[0].bunch_id);
        }
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
    await this.ensureCostingSchema();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE cost_estimations SET
          title = COALESCE(?, title),
          product_code = COALESCE(?, product_code),
          product_name = COALESCE(?, product_name),
          product_type = COALESCE(?, product_type),
          collection_name = COALESCE(?, collection_name),
          type_of_costing = COALESCE(?, type_of_costing),
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
          notes = COALESCE(?, notes),
          form_data = COALESCE(?, form_data)
        WHERE id = ?`,
        [
          estimation.title ?? null,
          estimation.product_code ?? null,
          estimation.product_name ?? null,
          estimation.product_type ?? null,
          estimation.collection_name ?? null,
          estimation.type_of_costing ?? null,
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
          (estimation as any).form_data ?? null,
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

      // Sync with linked costing_request_items if any
      const [linkedReqs]: any = await conn.query(
        `SELECT id, bunch_id FROM costing_request_items WHERE estimation_id = ? OR id = (SELECT costing_request_item_id FROM cost_estimations WHERE id = ?)`,
        [id, id]
      );
      if (linkedReqs && linkedReqs.length > 0) {
        const itemStage = estimation.status === 'Approved' ? 'Approved' : (estimation.status === 'In Review' ? 'In Review' : 'In Progress');
        const finalPrice = estimation.final_price !== undefined ? estimation.final_price : null;
        let usdRate = 86.5;
        try {
          if ((estimation as any).form_data) {
            const parsed = typeof (estimation as any).form_data === 'string' ? JSON.parse((estimation as any).form_data) : (estimation as any).form_data;
            if (parsed.usdExchangeRate) usdRate = Number(parsed.usdExchangeRate) || 86.5;
          }
        } catch (_) {}
        const finalPriceUsd = finalPrice ? Number((finalPrice / usdRate).toFixed(2)) : null;

        for (const req of linkedReqs) {
          await conn.query(
            `UPDATE costing_request_items SET
              estimation_id = ?,
              stage = ?,
              final_price = COALESCE(?, final_price),
              final_price_usd = COALESCE(?, final_price_usd)
             WHERE id = ?`,
            [id, itemStage, finalPrice, finalPriceUsd, req.id]
          );
          if (req.bunch_id) {
            await this.syncBunchStatusInternal(conn, req.bunch_id);
          }
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
    await this.ensureCostingSchema();
    const [result]: any = await pool.query(`DELETE FROM cost_estimations WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Cost Rates Master methods
  async findAllRates(): Promise<CostRateMaster[]> {
    await this.ensureCostingSchema();
    const [rows]: any = await pool.query(`SELECT * FROM cost_rates_master ORDER BY category, item_name`);
    return rows as CostRateMaster[];
  }

  async saveRate(rate: CostRateMaster): Promise<CostRateMaster> {
    await this.ensureCostingSchema();
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
    await this.ensureCostingSchema();
    const [result]: any = await pool.query(`DELETE FROM cost_rates_master WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async getSummary(): Promise<any> {
    await this.ensureCostingSchema();
    const [totalRows]: any = await pool.query(`SELECT COUNT(*) as total_count, COALESCE(SUM(final_price), 0) as total_value FROM cost_estimations`);
    const [statusRows]: any = await pool.query(`SELECT status, COUNT(*) as count, COALESCE(SUM(final_price), 0) as value FROM cost_estimations GROUP BY status`);
    
    return {
      overview: totalRows[0],
      byStatus: statusRows
    };
  }

  // Costing Request Bunches & Items
  private async syncBunchStatusInternal(conn: any, bunchId: string): Promise<void> {
    const [items]: any = await conn.query(`SELECT stage FROM costing_request_items WHERE bunch_id = ?`, [bunchId]);
    if (!items || items.length === 0) return;
    const allApproved = items.every((i: any) => i.stage === 'Approved');
    const anyInProgress = items.some((i: any) => ['In Progress', 'In Review', 'Approved'].includes(i.stage));
    let status = 'Pending';
    if (allApproved) {
      status = 'Completed';
    } else if (anyInProgress) {
      status = 'In Progress';
    }
    await conn.query(`UPDATE costing_request_bunches SET status = ? WHERE id = ?`, [status, bunchId]);
  }

  async generateBunchCode(): Promise<string> {
    await this.ensureCostingSchema();
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `BUN-${yy}${mm}-`;
    const [rows]: any = await pool.query(
      `SELECT bunch_code FROM costing_request_bunches WHERE bunch_code LIKE ? ORDER BY created_at DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows && rows.length > 0) {
      const lastCode = rows[0].bunch_code;
      const seq = parseInt(lastCode.replace(prefix, ""), 10);
      const nextSeq = isNaN(seq) ? 1 : seq + 1;
      return `${prefix}${String(nextSeq).padStart(4, "0")}`;
    }
    return `${prefix}0001`;
  }

  async getNextCostingCodeNumber(): Promise<number> {
    await this.ensureCostingSchema();
    const [rows]: any = await pool.query(
      `SELECT MAX(CAST(costing_code AS UNSIGNED)) AS max_code
       FROM costing_request_items
       WHERE costing_code REGEXP '^[0-9]+$'`
    );
    const maxCode = Number(rows?.[0]?.max_code || 0);
    return maxCode + 1;
  }

  async createBunchWithItems(bunchData: {
    merchant_id?: string;
    merchant_name: string;
    client_name?: string;
    notes?: string;
    priority?: 'Normal' | 'High' | 'Urgent';
  }, items: Array<{
    product_name: string;
    product_code?: string;
    buyer_code?: string;
    costing_code?: string;
    product_type?: string;
    collection_name?: string;
    sample_availability?: 'Not Available' | 'Sample Available';
    wood_type?: string;
    overall_size?: string;
    client_name?: string;
    target_price?: number | null;
    target_currency?: string | null;
    description?: string;
    image_url?: string;
    image_urls?: string[];
    priority?: 'Normal' | 'High' | 'Urgent';
  }>): Promise<CostingRequestBunch> {
    await this.ensureCostingSchema();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const bunchId = uuidv4();
      const bunchCode = await this.generateBunchCode();
      const priority = bunchData.priority || 'Normal';
      const totalProducts = items.length;

      const [maxRows]: any = await conn.query(
        `SELECT MAX(CAST(costing_code AS UNSIGNED)) AS max_code
         FROM costing_request_items
         WHERE costing_code REGEXP '^[0-9]+$'`
      );
      let nextNumericCode = Number(maxRows?.[0]?.max_code || 0) + 1;

      await conn.query(
        `INSERT INTO costing_request_bunches (
          id, bunch_code, merchant_id, merchant_name, client_name, notes, priority, total_products, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
        [
          bunchId,
          bunchCode,
          bunchData.merchant_id || null,
          bunchData.merchant_name,
          bunchData.client_name || null,
          bunchData.notes || null,
          priority,
          totalProducts,
        ]
      );

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const itemId = uuidv4();

        let costingCode = (item.costing_code && item.costing_code.trim())
          ? item.costing_code.trim()
          : String(nextNumericCode);
        if (/^[0-9]+$/.test(costingCode)) {
          const numVal = parseInt(costingCode, 10);
          if (numVal >= nextNumericCode) {
            nextNumericCode = numVal + 1;
          }
        } else {
          nextNumericCode += 1;
        }

        const buyerCode = (item.buyer_code && item.buyer_code.trim()) ? item.buyer_code.trim() : null;
        const autoProductCode = costingCode;

        const cleanImageUrls = Array.isArray(item.image_urls)
          ? item.image_urls.map((u) => (u || "").trim()).filter(Boolean)
          : [];
        const primaryImageUrl = (item.image_url && item.image_url.trim())
          ? item.image_url.trim()
          : (cleanImageUrls[0] || null);
        const allImageUrls = cleanImageUrls.length > 0
          ? cleanImageUrls
          : (primaryImageUrl ? [primaryImageUrl] : []);

        const parsedTargetPrice =
          item.target_price !== undefined && item.target_price !== null && String(item.target_price).trim() !== ""
            ? Number(item.target_price)
            : null;
        const cleanTargetPrice = parsedTargetPrice !== null && Number.isFinite(parsedTargetPrice) ? parsedTargetPrice : null;
        const cleanTargetCurrency = item.target_currency ? String(item.target_currency).trim().toUpperCase() : "USD";

        await conn.query(
          `INSERT INTO costing_request_items (
            id, bunch_id, bunch_code, product_code, buyer_code, costing_code, product_name, product_type, collection_name, sample_availability,
            wood_type, overall_size, client_name, target_price, target_currency, description, image_url, image_urls, priority, stage,
            merchant_name, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
          [
            itemId,
            bunchId,
            bunchCode,
            autoProductCode,
            buyerCode,
            costingCode,
            item.product_name,
            item.product_type || null,
            item.collection_name || null,
            item.sample_availability || 'Not Available',
            item.wood_type || null,
            item.overall_size || null,
            item.client_name || bunchData.client_name || null,
            cleanTargetPrice,
            cleanTargetCurrency,
            item.description || null,
            primaryImageUrl,
            allImageUrls.length > 0 ? JSON.stringify(allImageUrls) : null,
            item.priority || priority,
            bunchData.merchant_name,
            bunchData.merchant_id || null,
          ]
        );
      }

      await conn.commit();
      return (await this.findBunchById(bunchId))!;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async findBunches(search?: string, status?: string, merchant?: string): Promise<CostingRequestBunch[]> {
    await this.ensureCostingSchema();
    let sql = `SELECT * FROM costing_request_bunches WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (merchant && merchant !== 'ALL') {
      sql += ` AND merchant_name = ?`;
      params.push(merchant);
    }
    if (search) {
      sql += ` AND (bunch_code LIKE ? OR merchant_name LIKE ? OR client_name LIKE ? OR notes LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    sql += ` ORDER BY created_at DESC`;

    const [bunches]: any = await pool.query(sql, params);
    if (!bunches || bunches.length === 0) return [];

    const bunchIds = bunches.map((b: any) => b.id);
    const [items]: any = await pool.query(
      `SELECT
        cri.*,
        COALESCE(cri.final_price, ce.final_price) as final_price,
        COALESCE(cri.final_price_usd, CASE WHEN ce.final_price > 0 THEN ROUND(ce.final_price / 86.5, 2) ELSE NULL END) as final_price_usd
       FROM costing_request_items cri
       LEFT JOIN cost_estimations ce ON cri.estimation_id = ce.id
       WHERE cri.bunch_id IN (?)
       ORDER BY cri.created_at ASC`,
      [bunchIds]
    );

    const itemsByBunchId: Record<string, CostingRequestItem[]> = {};
    for (const it of items) {
      if (!itemsByBunchId[it.bunch_id]) itemsByBunchId[it.bunch_id] = [];
      itemsByBunchId[it.bunch_id].push(it);
    }

    return bunches.map((b: any) => ({
      ...b,
      items: itemsByBunchId[b.id] || [],
    }));
  }

  async findBunchById(idOrCode: string): Promise<CostingRequestBunch | null> {
    await this.ensureCostingSchema();
    const [bunches]: any = await pool.query(
      `SELECT * FROM costing_request_bunches WHERE id = ? OR bunch_code = ? LIMIT 1`,
      [idOrCode, idOrCode]
    );
    if (!bunches || bunches.length === 0) return null;
    const bunch = bunches[0];
    const [items]: any = await pool.query(
      `SELECT
        cri.*,
        COALESCE(cri.final_price, ce.final_price) as final_price,
        COALESCE(cri.final_price_usd, CASE WHEN ce.final_price > 0 THEN ROUND(ce.final_price / 86.5, 2) ELSE NULL END) as final_price_usd
       FROM costing_request_items cri
       LEFT JOIN cost_estimations ce ON cri.estimation_id = ce.id
       WHERE cri.bunch_id = ?
       ORDER BY cri.created_at ASC`,
      [bunch.id]
    );
    return {
      ...bunch,
      items: items || [],
    };
  }

  private extractLatestBuyerQuote(rawFormData: any): {
    label: string;
    currency: string;
    amount: number;
    note?: string;
    usd_rate: number;
  } | null {
    if (!rawFormData) return null;
    try {
      const fd = typeof rawFormData === "string" ? JSON.parse(rawFormData) : rawFormData;
      if (!fd || !Array.isArray(fd.buyerQuotes) || fd.buyerQuotes.length === 0) return null;

      const usdRate = Number(fd.usdExchangeRate) > 0 ? Number(fd.usdExchangeRate) : 86.5;

      // Pick the LAST filled buyer quote (1st, 2nd, 3rd, etc.)
      for (let i = fd.buyerQuotes.length - 1; i >= 0; i--) {
        const q = fd.buyerQuotes[i];
        const amt = Number(q?.amount);
        if (q && q.amount !== "" && q.amount !== null && q.amount !== undefined && Number.isFinite(amt) && amt > 0) {
          const num = i + 1;
          const mod100 = num % 100;
          let suffix = "th";
          if (mod100 < 11 || mod100 > 13) {
            if (num % 10 === 1) suffix = "st";
            else if (num % 10 === 2) suffix = "nd";
            else if (num % 10 === 3) suffix = "rd";
          }
          return {
            label: `${num}${suffix} Quote`,
            currency: (q.currency || "USD").toUpperCase(),
            amount: amt,
            note: q.note || "",
            usd_rate: usdRate,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async findRequestItems(search?: string, stage?: string, priority?: string, bunchCode?: string, merchant?: string): Promise<CostingRequestItem[]> {
    await this.ensureCostingSchema();
    let sql = `
      SELECT
        cri.*,
        COALESCE(cri.final_price, ce.final_price) as final_price,
        COALESCE(cri.final_price_usd, CASE WHEN ce.final_price > 0 THEN ROUND(ce.final_price / 86.5, 2) ELSE NULL END) as final_price_usd,
        ce.form_data as estimation_form_data
      FROM costing_request_items cri
      LEFT JOIN cost_estimations ce ON cri.estimation_id = ce.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (stage && stage !== 'ALL') {
      sql += ` AND cri.stage = ?`;
      params.push(stage);
    }
    if (priority && priority !== 'ALL') {
      sql += ` AND cri.priority = ?`;
      params.push(priority);
    }
    if (bunchCode) {
      sql += ` AND cri.bunch_code = ?`;
      params.push(bunchCode);
    }
    if (merchant && merchant !== 'ALL') {
      sql += ` AND cri.merchant_name = ?`;
      params.push(merchant);
    }
    if (search) {
      sql += ` AND (cri.costing_code LIKE ? OR cri.buyer_code LIKE ? OR cri.product_code LIKE ? OR cri.product_name LIKE ? OR cri.merchant_name LIKE ? OR cri.client_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }
    sql += ` ORDER BY cri.created_at DESC`;

    const [rows]: any = await pool.query(sql, params);
    return (rows || []).map((row: any) => {
      const latestBuyerQuote = this.extractLatestBuyerQuote(row.estimation_form_data);
      const { estimation_form_data: _ignored, ...rest } = row;
      return {
        ...rest,
        latest_buyer_quote: latestBuyerQuote,
      };
    }) as CostingRequestItem[];
  }

  async findRequestItemById(id: string): Promise<CostingRequestItem | null> {
    await this.ensureCostingSchema();
    const [rows]: any = await pool.query(`SELECT * FROM costing_request_items WHERE id = ? LIMIT 1`, [id]);
    return (rows && rows.length > 0) ? (rows[0] as CostingRequestItem) : null;
  }

  async updateRequestItemDetails(
    id: string,
    data: {
      product_name?: string;
      costing_code?: string;
      buyer_code?: string;
      product_type?: string;
      collection_name?: string;
      sample_availability?: string;
      wood_type?: string;
      overall_size?: string;
      client_name?: string;
      target_price?: number | null;
      target_currency?: string | null;
      description?: string;
      priority?: 'Normal' | 'High' | 'Urgent';
    }
  ): Promise<CostingRequestItem | null> {
    await this.ensureCostingSchema();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const hasTargetPrice = data.target_price !== undefined;
      const parsedTarget =
        data.target_price !== undefined && data.target_price !== null && String(data.target_price).trim() !== ""
          ? Number(data.target_price)
          : null;
      const cleanTargetPrice = parsedTarget !== null && Number.isFinite(parsedTarget) ? parsedTarget : null;
      const cleanTargetCurrency = data.target_currency ? String(data.target_currency).trim().toUpperCase() : null;

      await conn.query(
        `UPDATE costing_request_items SET
          product_name = COALESCE(?, product_name),
          costing_code = COALESCE(?, costing_code),
          product_code = COALESCE(?, product_code),
          buyer_code = ?,
          product_type = COALESCE(?, product_type),
          collection_name = COALESCE(?, collection_name),
          sample_availability = COALESCE(?, sample_availability),
          wood_type = COALESCE(?, wood_type),
          overall_size = COALESCE(?, overall_size),
          client_name = COALESCE(?, client_name),
          target_price = ${hasTargetPrice ? "?" : "target_price"},
          target_currency = COALESCE(?, target_currency),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority)
         WHERE id = ?`,
        hasTargetPrice
          ? [
              data.product_name ?? null,
              data.costing_code ?? null,
              data.costing_code ?? null,
              data.buyer_code !== undefined ? (data.buyer_code || null) : null,
              data.product_type ?? null,
              data.collection_name ?? null,
              data.sample_availability ?? null,
              data.wood_type ?? null,
              data.overall_size ?? null,
              data.client_name ?? null,
              cleanTargetPrice,
              cleanTargetCurrency,
              data.description ?? null,
              data.priority ?? null,
              id,
            ]
          : [
              data.product_name ?? null,
              data.costing_code ?? null,
              data.costing_code ?? null,
              data.buyer_code !== undefined ? (data.buyer_code || null) : null,
              data.product_type ?? null,
              data.collection_name ?? null,
              data.sample_availability ?? null,
              data.wood_type ?? null,
              data.overall_size ?? null,
              data.client_name ?? null,
              cleanTargetCurrency,
              data.description ?? null,
              data.priority ?? null,
              id,
            ]
      );

      // If linked to an existing cost_estimation, sync targetPrice/targetCurrency & buyerCode into its form_data
      const [itemRows]: any = await conn.query(`SELECT * FROM costing_request_items WHERE id = ? LIMIT 1`, [id]);
      if (itemRows && itemRows.length > 0 && itemRows[0].estimation_id) {
        const estId = itemRows[0].estimation_id;
        const [estRows]: any = await conn.query(`SELECT form_data FROM cost_estimations WHERE id = ? LIMIT 1`, [estId]);
        if (estRows && estRows.length > 0) {
          let fd: any = {};
          try {
            fd = estRows[0].form_data
              ? typeof estRows[0].form_data === "string"
                ? JSON.parse(estRows[0].form_data)
                : estRows[0].form_data
              : {};
          } catch {
            fd = {};
          }
          if (hasTargetPrice) {
            fd.targetPrice = cleanTargetPrice !== null ? cleanTargetPrice : "";
          }
          if (cleanTargetCurrency) {
            fd.targetCurrency = cleanTargetCurrency;
          }
          if (data.buyer_code !== undefined) {
            fd.buyerCode = data.buyer_code || "";
          }
          await conn.query(
            `UPDATE cost_estimations SET
              form_data = ?,
              client_name = COALESCE(?, client_name),
              product_name = COALESCE(?, product_name),
              product_code = COALESCE(?, product_code)
             WHERE id = ?`,
            [
              JSON.stringify(fd),
              data.client_name ?? null,
              data.product_name ?? null,
              data.costing_code ?? null,
              estId,
            ]
          );
        }
      }

      await conn.commit();
      return itemRows && itemRows.length > 0 ? (itemRows[0] as CostingRequestItem) : null;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateRequestItemStage(id: string, stage: string, estimationId?: string, estimationNumber?: string, finalPrice?: number, finalPriceUsd?: number): Promise<boolean> {
    await this.ensureCostingSchema();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let calcUsd = finalPriceUsd;
      if (finalPrice && !calcUsd) {
        calcUsd = Number((finalPrice / 86.5).toFixed(2));
      }

      const [res]: any = await conn.query(
        `UPDATE costing_request_items SET
          stage = ?,
          approved_at = CASE WHEN ? = 'Approved' THEN COALESCE(approved_at, NOW()) ELSE approved_at END,
          estimation_id = COALESCE(?, estimation_id),
          estimation_number = COALESCE(?, estimation_number),
          final_price = COALESCE(?, final_price),
          final_price_usd = COALESCE(?, final_price_usd)
         WHERE id = ?`,
        [stage, stage, estimationId || null, estimationNumber || null, finalPrice || null, calcUsd || null, id]
      );
      const [itemRows]: any = await conn.query(`SELECT bunch_id, estimation_id, final_price FROM costing_request_items WHERE id = ?`, [id]);
      if (itemRows && itemRows.length > 0) {
        const estId = itemRows[0].estimation_id;
        if (estId && (stage === 'Approved' || stage === 'Rejected')) {
          const estStatus = stage === 'Approved' ? 'Approved' : 'Rejected';
          await conn.query(`UPDATE cost_estimations SET status = ? WHERE id = ?`, [estStatus, estId]);
        }
        await this.syncBunchStatusInternal(conn, itemRows[0].bunch_id);
      }
      await conn.commit();
      return res.affectedRows > 0;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getCostingTracker(search?: string, stage?: string, merchant?: string, dateFrom?: string, dateTo?: string): Promise<any> {
    await this.ensureCostingSchema();
    let sql = `
      SELECT
        cri.*,
        COALESCE(cri.final_price, ce.final_price) as final_price,
        COALESCE(cri.final_price_usd, CASE WHEN ce.final_price > 0 THEN ROUND(ce.final_price / 86.5, 2) ELSE NULL END) as final_price_usd,
        CASE WHEN cri.stage = 'Approved' THEN COALESCE(cri.approved_at, cri.updated_at) ELSE NULL END as approved_at,
        ce.form_data as estimation_form_data
      FROM costing_request_items cri
      LEFT JOIN cost_estimations ce ON cri.estimation_id = ce.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (stage && stage !== 'ALL') {
      sql += ` AND cri.stage = ?`;
      params.push(stage);
    }
    if (merchant && merchant !== 'ALL') {
      sql += ` AND cri.merchant_name = ?`;
      params.push(merchant);
    }
    if (dateFrom) {
      sql += ` AND cri.created_at >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND cri.created_at <= ?`;
      params.push(`${dateTo} 23:59:59`);
    }
    if (search) {
      sql += ` AND (cri.costing_code LIKE ? OR cri.buyer_code LIKE ? OR cri.product_code LIKE ? OR cri.product_name LIKE ? OR cri.merchant_name LIKE ? OR cri.client_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }
    sql += ` ORDER BY cri.created_at DESC`;

    const [rawItems]: any = await pool.query(sql, params);
    const items = (rawItems || []).map((row: any) => {
      const latestBuyerQuote = this.extractLatestBuyerQuote(row.estimation_form_data);
      const { estimation_form_data: _ignored, ...rest } = row;
      return {
        ...rest,
        latest_buyer_quote: latestBuyerQuote,
      };
    });

    // Summary counts
    const [counts]: any = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN stage = 'Pending' THEN 1 ELSE 0 END) as not_started_count,
        SUM(CASE WHEN stage IN ('In Progress', 'In Review') THEN 1 ELSE 0 END) as under_process_count,
        SUM(CASE WHEN stage = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN stage = 'Rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM costing_request_items
    `);

    return {
      kpis: counts[0] || {
        total_requests: 0,
        not_started_count: 0,
        under_process_count: 0,
        approved_count: 0,
        rejected_count: 0,
      },
      items: items || [],
    };
  }

  async getDashboardMetrics(): Promise<any> {
    await this.ensureCostingSchema();
    const [counts]: any = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN stage = 'Pending' THEN 1 ELSE 0 END) as not_started_count,
        SUM(CASE WHEN stage = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN stage = 'In Review' THEN 1 ELSE 0 END) as in_review_count,
        SUM(CASE WHEN stage = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN stage = 'Rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM costing_request_items
    `);

    const [bunchCount]: any = await pool.query(`SELECT COUNT(*) as total_bunches FROM costing_request_bunches`);
    const [recentItems]: any = await pool.query(`
      SELECT id, bunch_code, product_code, product_name, merchant_name, client_name, stage, priority, final_price, created_at
      FROM costing_request_items
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const [merchantStats]: any = await pool.query(`
      SELECT merchant_name, COUNT(*) as total_products,
        SUM(CASE WHEN stage = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN stage = 'Pending' THEN 1 ELSE 0 END) as pending
      FROM costing_request_items
      GROUP BY merchant_name
      ORDER BY total_products DESC
      LIMIT 10
    `);

    return {
      metrics: {
        total_requests: Number(counts[0]?.total_requests || 0),
        not_started_count: Number(counts[0]?.not_started_count || 0),
        in_progress_count: Number(counts[0]?.in_progress_count || 0),
        in_review_count: Number(counts[0]?.in_review_count || 0),
        approved_count: Number(counts[0]?.approved_count || 0),
        rejected_count: Number(counts[0]?.rejected_count || 0),
        total_bunches: Number(bunchCount[0]?.total_bunches || 0),
      },
      recent_activity: recentItems || [],
      merchant_breakdown: merchantStats || [],
    };
  }
}
