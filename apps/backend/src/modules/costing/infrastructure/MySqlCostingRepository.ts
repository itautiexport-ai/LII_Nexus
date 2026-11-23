import { pool } from "../../../infrastructure/database/mysql/connection";
import { CostEstimation, CostEstimationItem, CostRateMaster, CostingRequestBunch, CostingRequestItem } from "../domain/CostEstimation";
import { v4 as uuidv4 } from "uuid";
import type { PoolConnection } from "mysql2/promise";
import { ConflictError, ForbiddenError } from "../../../core/domain/errors/DomainError";

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
      ["approval_authority_id", "VARCHAR(36) NULL AFTER form_data"],
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

    // Ensure final_price_usd column exists on costing_request_items
    const [usdCols]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'costing_request_items' AND COLUMN_NAME = 'final_price_usd'`
    );
    if (!Array.isArray(usdCols) || usdCols.length === 0) {
      await pool.query(`ALTER TABLE costing_request_items ADD COLUMN final_price_usd DECIMAL(15,2) NULL AFTER final_price`);
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
        (UUID(), 'Menu: Costing & Estimation -> New Costing Sheet', 'Access to New Costing Sheet under Costing & Estimation', 0),
        (UUID(), 'Menu: Costing & Estimation -> List of New Costing', 'Access to List of New Costing under Costing & Estimation', 0)`
    );

    this.schemaEnsured = true;
  }

  private async nextNumber(
    connection: Pick<PoolConnection, 'query'>,
    table: 'cost_estimations' | 'costing_request_bunches',
    column: 'estimation_number' | 'bunch_code',
    prefix: string
  ): Promise<string> {
    const [rows]: any = await connection.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(${column}, ?) AS UNSIGNED)), 0) AS last_sequence
       FROM ${table} WHERE ${column} REGEXP ?`,
      [prefix.length + 1, `^${prefix}[0-9]+$`]
    );
    const next = Number(rows[0].last_sequence) + 1;
    if (!Number.isSafeInteger(next)) throw new ConflictError('Costing number range exceeded.');
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  private async withNumberTransaction<T>(
    kind: 'estimation' | 'bunch',
    action: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const conn = await pool.getConnection();
    let held = false;
    let reusable = true;
    // Database-specific session lock works across application processes.
    const lockKey = `:costing:${kind}-number`;
    try {
      const [locks]: any = await conn.query(
        'SELECT GET_LOCK(SHA2(CONCAT(DATABASE(), ?), 256), 15) AS acquired', [lockKey]
      );
      if (Number(locks[0].acquired) !== 1) {
        throw new ConflictError('Another costing is being saved. Please retry shortly.');
      }
      held = true;
      await conn.beginTransaction();
      const result = await action(conn);
      await conn.commit();
      return result;
    } catch (error) {
      try { await conn.rollback(); } catch (_) { reusable = false; }
      throw error;
    } finally {
      if (held) {
        try {
          const [released]: any = await conn.query(
            'SELECT RELEASE_LOCK(SHA2(CONCAT(DATABASE(), ?), 256)) AS released', [lockKey]
          );
          reusable = reusable && Number(released[0].released) === 1;
        } catch (_) { reusable = false; }
      }
      if (reusable) conn.release();
      else conn.destroy();
    }
  }

  // Without a connection this is a preview, not a reservation.
  async generateEstimationNumber(connection?: PoolConnection): Promise<string> {
    if (!connection) await this.ensureCostingSchema();
    return this.nextNumber(connection || pool, 'cost_estimations', 'estimation_number',
      `EST-${new Date().getFullYear()}-`);
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
    await this.withNumberTransaction('estimation', async conn => {
      estimation.estimation_number = await this.generateEstimationNumber(conn);

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

    });
    // Release the connection before the readback to avoid exhausting the pool.
    return (await this.findEstimationById(estimation.id))!;
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
          form_data = COALESCE(?, form_data),
          approval_authority_id = COALESCE(?, approval_authority_id)
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
          estimation.approval_authority_id ?? null,
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

  // Preview codes may change before save; allocation happens in the transaction.
  async generateBunchCode(connection?: PoolConnection): Promise<string> {
    if (!connection) await this.ensureCostingSchema();
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return this.nextNumber(connection || pool, 'costing_request_bunches', 'bunch_code',
      `BUN-${yy}${mm}-`);
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
    product_type?: string;
    collection_name?: string;
    wood_type?: string;
    overall_size?: string;
    client_name?: string;
    description?: string;
    image_url?: string;
    priority?: 'Normal' | 'High' | 'Urgent';
  }>): Promise<CostingRequestBunch> {
    await this.ensureCostingSchema();
    const bunchId = uuidv4();
    await this.withNumberTransaction('bunch', async conn => {
      const bunchCode = await this.generateBunchCode(conn);
      const priority = bunchData.priority || 'Normal';
      const totalProducts = items.length;

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
        const autoProductCode = (item.product_code && item.product_code.trim())
          ? item.product_code.trim()
          : `${bunchCode}-P${String(idx + 1).padStart(2, '0')}`;

        await conn.query(
          `INSERT INTO costing_request_items (
            id, bunch_id, bunch_code, product_code, product_name, product_type, collection_name,
            wood_type, overall_size, client_name, description, image_url, priority, stage,
            merchant_name, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
          [
            itemId,
            bunchId,
            bunchCode,
            autoProductCode,
            item.product_name,
            item.product_type || null,
            item.collection_name || null,
            item.wood_type || null,
            item.overall_size || null,
            item.client_name || bunchData.client_name || null,
            item.description || null,
            item.image_url || null,
            item.priority || priority,
            bunchData.merchant_name,
            bunchData.merchant_id || null,
          ]
        );
      }

    });
    return (await this.findBunchById(bunchId))!;
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

  async findRequestItems(search?: string, stage?: string, priority?: string, bunchCode?: string, merchant?: string): Promise<CostingRequestItem[]> {
    await this.ensureCostingSchema();
    let sql = `
      SELECT
        cri.*,
        COALESCE(cri.final_price, ce.final_price) as final_price,
        COALESCE(cri.final_price_usd, CASE WHEN ce.final_price > 0 THEN ROUND(ce.final_price / 86.5, 2) ELSE NULL END) as final_price_usd
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
      sql += ` AND (cri.product_code LIKE ? OR cri.product_name LIKE ? OR cri.bunch_code LIKE ? OR cri.merchant_name LIKE ? OR cri.client_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }
    sql += ` ORDER BY cri.created_at DESC`;

    const [rows]: any = await pool.query(sql, params);
    return rows as CostingRequestItem[];
  }

  async findRequestItemById(id: string): Promise<CostingRequestItem | null> {
    await this.ensureCostingSchema();
    const [rows]: any = await pool.query(`SELECT * FROM costing_request_items WHERE id = ? LIMIT 1`, [id]);
    return (rows && rows.length > 0) ? (rows[0] as CostingRequestItem) : null;
  }

  async updateRequestItemStage(id: string, stage: string, estimationId?: string, estimationNumber?: string, finalPrice?: number, finalPriceUsd?: number, actorCanApprove: boolean = false): Promise<boolean> {
    await this.ensureCostingSchema();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock before checking so a concurrent approval cannot be reset by a stale request.
      const [currentRows]: any = await conn.query(
        'SELECT stage, estimation_id FROM costing_request_items WHERE id = ? FOR UPDATE', [id]
      );
      if (!currentRows.length) {
        await conn.rollback();
        return false;
      }
      const current = currentRows[0];
      const finalized = (value: string) => value === 'Approved' || value === 'Rejected';
      if (!actorCanApprove && (finalized(stage) || finalized(current.stage))) {
        throw new ForbiddenError('Only Ravi Utmani or Raj Utmani can approve, reject or modify finalized costing.');
      }
      // Protect both the existing and requested linked estimation from indirect changes.
      for (const linkedId of [...new Set([current.estimation_id, estimationId].filter(Boolean))].sort()) {
        const [linkedRows]: any = await conn.query(
          'SELECT status FROM cost_estimations WHERE id = ? FOR UPDATE', [linkedId]
        );
        if (!actorCanApprove && linkedRows.some((row: any) => finalized(row.status))) {
          throw new ForbiddenError('Only Ravi Utmani or Raj Utmani can modify finalized costing.');
        }
      }

      let calcUsd = finalPriceUsd;
      if (finalPrice && !calcUsd) {
        calcUsd = Number((finalPrice / 86.5).toFixed(2));
      }

      const [res]: any = await conn.query(
        `UPDATE costing_request_items SET
          stage = ?,
          estimation_id = COALESCE(?, estimation_id),
          estimation_number = COALESCE(?, estimation_number),
          final_price = COALESCE(?, final_price),
          final_price_usd = COALESCE(?, final_price_usd)
         WHERE id = ?`,
        [stage, estimationId || null, estimationNumber || null, finalPrice || null, calcUsd || null, id]
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
    let sql = `SELECT * FROM costing_request_items WHERE 1=1`;
    const params: any[] = [];

    if (stage && stage !== 'ALL') {
      sql += ` AND stage = ?`;
      params.push(stage);
    }
    if (merchant && merchant !== 'ALL') {
      sql += ` AND merchant_name = ?`;
      params.push(merchant);
    }
    if (dateFrom) {
      sql += ` AND created_at >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND created_at <= ?`;
      params.push(`${dateTo} 23:59:59`);
    }
    if (search) {
      sql += ` AND (product_code LIKE ? OR product_name LIKE ? OR bunch_code LIKE ? OR merchant_name LIKE ? OR client_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }
    sql += ` ORDER BY created_at DESC`;

    const [items]: any = await pool.query(sql, params);

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
