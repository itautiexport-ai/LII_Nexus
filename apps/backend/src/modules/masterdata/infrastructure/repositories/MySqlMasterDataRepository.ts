import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export class MySqlMasterDataRepository {
  // Wood Types
  async getWoodTypes() {
    const [rows] = await pool.query("SELECT * FROM wood_types WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows;
  }

  async createWoodType(name: string) {
    const id = uuid();
    await pool.query("INSERT INTO wood_types (id, name) VALUES (?, ?)", [id, name]);
    const [rows]: any = await pool.query("SELECT * FROM wood_types WHERE id = ?", [id]);
    return rows[0];
  }

  async updateWoodType(id: string, name: string, status: string) {
    await pool.query("UPDATE wood_types SET name = ?, status = ? WHERE id = ?", [name, status, id]);
    const [rows]: any = await pool.query("SELECT * FROM wood_types WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteWoodType(id: string) {
    try {
      await pool.query("DELETE FROM wood_types WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE wood_types SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }

  // Priorities
  async getPriorities() {
    const [rows] = await pool.query("SELECT * FROM priorities WHERE deleted_at IS NULL ORDER BY created_at ASC");
    return rows;
  }

  async createPriority(name: string, colorCode: string) {
    const id = uuid();
    await pool.query("INSERT INTO priorities (id, name, color_code) VALUES (?, ?, ?)", [id, name, colorCode]);
    const [rows]: any = await pool.query("SELECT * FROM priorities WHERE id = ?", [id]);
    return rows[0];
  }

  async updatePriority(id: string, name: string, colorCode: string, status: string) {
    await pool.query("UPDATE priorities SET name = ?, color_code = ?, status = ? WHERE id = ?", [name, colorCode, status, id]);
    const [rows]: any = await pool.query("SELECT * FROM priorities WHERE id = ?", [id]);
    return rows[0];
  }

  async deletePriority(id: string) {
    try {
      await pool.query("DELETE FROM priorities WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE priorities SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }

  // Buyers
  async getBuyers() {
    const [rows] = await pool.query("SELECT * FROM master_data_buyers WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows;
  }

  async createBuyer(name: string, buyerCode?: string | null, aliasName?: string | null) {
    const id = uuid();
    await pool.query(
      "INSERT INTO master_data_buyers (id, name, buyer_code, alias_name) VALUES (?, ?, ?, ?)",
      [id, name, buyerCode || null, aliasName || null]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_data_buyers WHERE id = ?", [id]);
    return rows[0];
  }

  async updateBuyer(id: string, name: string, buyerCode?: string | null, aliasName?: string | null) {
    await pool.query(
      "UPDATE master_data_buyers SET name = ?, buyer_code = ?, alias_name = ? WHERE id = ?",
      [name, buyerCode || null, aliasName || null, id]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_data_buyers WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteBuyer(id: string) {
    try {
      await pool.query("DELETE FROM master_data_buyers WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE master_data_buyers SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }

  // UOMs
  async getUoms() {
    const [rows] = await pool.query("SELECT * FROM uoms WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows;
  }

  async createUom(name: string) {
    const id = uuid();
    await pool.query("INSERT INTO uoms (id, name) VALUES (?, ?)", [id, name]);
    const [rows]: any = await pool.query("SELECT * FROM uoms WHERE id = ?", [id]);
    return rows[0];
  }

  async updateUom(id: string, name: string) {
    await pool.query("UPDATE uoms SET name = ? WHERE id = ?", [name, id]);
    const [rows]: any = await pool.query("SELECT * FROM uoms WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteUom(id: string) {
    try {
      await pool.query("DELETE FROM uoms WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE uoms SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }

  // HODs
  async getHods() {
    const [rows] = await pool.query<any[]>("SELECT * FROM master_hods ORDER BY name ASC");
    const [hodUsers] = await pool.query<any[]>(
      `SELECT DISTINCT e.full_name as name, e.id as id
       FROM employees e
       LEFT JOIN designations d ON e.designation_id = d.id
       LEFT JOIN user_roles ur ON e.user_id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE (LOWER(d.title) LIKE '%hod%' OR LOWER(r.name) LIKE '%hod%' OR LOWER(d.title) LIKE '%head%')
         AND e.deleted_at IS NULL AND e.full_name IS NOT NULL`
    );

    const masterMap = new Map<string, any>();
    (rows || []).forEach((r: any) => masterMap.set(r.name.toLowerCase().trim(), r));

    (hodUsers || []).forEach((hu: any) => {
      const key = hu.name.toLowerCase().trim();
      if (!masterMap.has(key)) {
        masterMap.set(key, { id: hu.id, name: hu.name });
      }
    });

    return Array.from(masterMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createHod(name: string) {
    const id = uuid();
    await pool.query("INSERT INTO master_hods (id, name) VALUES (?, ?)", [id, name]);
    const [rows]: any = await pool.query("SELECT * FROM master_hods WHERE id = ?", [id]);
    return rows[0];
  }

  async updateHod(id: string, name: string) {
    await pool.query("UPDATE master_hods SET name = ? WHERE id = ?", [name, id]);
    const [rows]: any = await pool.query("SELECT * FROM master_hods WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteHod(id: string) {
    await pool.query("DELETE FROM master_hods WHERE id = ?", [id]);
  }

  // QC Names
  async getQcNames() {
    const [rows] = await pool.query<any[]>("SELECT * FROM master_qc_names ORDER BY name ASC");
    return rows;
  }

  async createQcName(name: string) {
    const id = uuid();
    await pool.query("INSERT INTO master_qc_names (id, name) VALUES (?, ?)", [id, name]);
    const [rows]: any = await pool.query("SELECT * FROM master_qc_names WHERE id = ?", [id]);
    return rows[0];
  }

  async updateQcName(id: string, name: string) {
    await pool.query("UPDATE master_qc_names SET name = ? WHERE id = ?", [name, id]);
    const [rows]: any = await pool.query("SELECT * FROM master_qc_names WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteQcName(id: string) {
    await pool.query("DELETE FROM master_qc_names WHERE id = ?", [id]);
  }

  // Merchants
  async getMerchants() {
    const [rows] = await pool.query("SELECT * FROM master_merchants ORDER BY name ASC");
    return rows;
  }

  async createMerchant(name: string, status: string = 'active') {
    const id = uuid();
    await pool.query("INSERT INTO master_merchants (id, name, status) VALUES (?, ?, ?)", [id, name, status]);
    const [rows]: any = await pool.query("SELECT * FROM master_merchants WHERE id = ?", [id]);
    return rows[0];
  }

  async updateMerchant(id: string, name: string, status: string) {
    await pool.query("UPDATE master_merchants SET name = ?, status = ? WHERE id = ?", [name, status, id]);
    const [rows]: any = await pool.query("SELECT * FROM master_merchants WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteMerchant(id: string) {
    await pool.query("DELETE FROM master_merchants WHERE id = ?", [id]);
  }

  // Finish Codes
  async getFinishCodes() {
    const [rows] = await pool.query("SELECT * FROM finish_codes WHERE deleted_at IS NULL ORDER BY code ASC");
    return rows;
  }

  async createFinishCode(code: string, name: string) {
    const id = uuid();
    await pool.query("INSERT INTO finish_codes (id, code, name) VALUES (?, ?, ?)", [id, code, name]);
    const [rows]: any = await pool.query("SELECT * FROM finish_codes WHERE id = ?", [id]);
    return rows[0];
  }

  async updateFinishCode(id: string, code: string, name: string) {
    await pool.query("UPDATE finish_codes SET code = ?, name = ? WHERE id = ?", [code, name, id]);
    const [rows]: any = await pool.query("SELECT * FROM finish_codes WHERE id = ?", [id]);
    return rows[0];
  }

  async deleteFinishCode(id: string) {
    try {
      await pool.query("DELETE FROM finish_codes WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE finish_codes SET deleted_at = CURRENT_TIMESTAMP, code = CONCAT(code, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }

  // Hardware And Accessories
  private hwTableEnsured = false;
  private wtpTableEnsured = false;
  private wpnTableEnsured = false;

  private async ensureWoodPartNamesTable() {
    if (this.wpnTableEnsured) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_wood_part_names (
        id VARCHAR(64) PRIMARY KEY,
        part_code VARCHAR(80) NOT NULL DEFAULT '',
        part_name VARCHAR(150) NOT NULL,
        description VARCHAR(255) NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_wpn_part_name (part_name),
        INDEX idx_wpn_part_code (part_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    try {
      await pool.query("ALTER TABLE master_wood_part_names MODIFY COLUMN id VARCHAR(64) NOT NULL");
    } catch (_err) {
      // Ignore
    }
    try {
      await pool.query(
        "ALTER TABLE master_wood_part_names ADD COLUMN part_code VARCHAR(80) NOT NULL DEFAULT '' AFTER id"
      );
    } catch (_err) {
      // Column already exists
    }
    await pool.query(
      `INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
        (UUID(), 'Menu: Administration -> Master Data -> Costing Master -> Wood Part Name', 'Access to Wood Part Name module under Costing Master', 0),
        (UUID(), 'Menu: Administration -> Master Data -> Wood Part Name', 'Access to Wood Part Name module under Master Data', 0)`
    );
    this.wpnTableEnsured = true;
  }

  private mapWoodPartNameRow(row: any) {
    return {
      id: row.id,
      partCode: row.part_code || "",
      partName: row.part_name,
    };
  }

  async getWoodPartNames() {
    await this.ensureWoodPartNamesTable();
    const [rows]: any = await pool.query(
      "SELECT * FROM master_wood_part_names WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return (rows || []).map((r: any) => this.mapWoodPartNameRow(r));
  }

  async createWoodPartName(input: {
    id?: string;
    partCode: string;
    partName: string;
  }) {
    await this.ensureWoodPartNamesTable();
    const id = input.id || uuid();
    await pool.query(
      `INSERT INTO master_wood_part_names (id, part_code, part_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
        part_code = VALUES(part_code),
        part_name = VALUES(part_name),
        deleted_at = NULL`,
      [id, input.partCode, input.partName]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_wood_part_names WHERE id = ?", [id]);
    return this.mapWoodPartNameRow(rows[0]);
  }

  async updateWoodPartName(
    id: string,
    input: {
      partCode: string;
      partName: string;
    }
  ) {
    await this.ensureWoodPartNamesTable();
    await pool.query(
      `UPDATE master_wood_part_names
       SET part_code = ?, part_name = ?
       WHERE id = ?`,
      [input.partCode, input.partName, id]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_wood_part_names WHERE id = ?", [id]);
    return rows[0] ? this.mapWoodPartNameRow(rows[0]) : null;
  }

  async deleteWoodPartName(id: string) {
    await this.ensureWoodPartNamesTable();
    try {
      await pool.query("DELETE FROM master_wood_part_names WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query(
          "UPDATE master_wood_part_names SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
          [id]
        );
      } else throw err;
    }
  }

  private async ensureWoodThicknessPricesTable() {
    if (this.wtpTableEnsured) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_wood_thickness_prices (
        id VARCHAR(64) PRIMARY KEY,
        wood_type VARCHAR(150) NOT NULL,
        thickness VARCHAR(80) NOT NULL,
        thickness_uom VARCHAR(40) NOT NULL DEFAULT 'inch',
        length VARCHAR(80) NOT NULL,
        length_uom VARCHAR(40) NOT NULL DEFAULT 'feet',
        rate_per_cft DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_wtp_wood_type (wood_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    this.wtpTableEnsured = true;
  }

  private mapWoodThicknessPriceRow(row: any) {
    return {
      id: row.id,
      woodType: row.wood_type,
      thickness: row.thickness,
      thicknessUom: row.thickness_uom || "inch",
      length: row.length,
      lengthUom: row.length_uom || "feet",
      ratePerCft: parseFloat(row.rate_per_cft ?? 0),
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "",
    };
  }

  async getWoodThicknessPrices() {
    await this.ensureWoodThicknessPricesTable();
    const [rows]: any = await pool.query(
      "SELECT * FROM master_wood_thickness_prices WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return (rows || []).map((r: any) => this.mapWoodThicknessPriceRow(r));
  }

  async createWoodThicknessPrice(input: {
    id?: string;
    woodType: string;
    thickness: string;
    thicknessUom: string;
    length: string;
    lengthUom: string;
    ratePerCft: number;
    status?: string;
  }) {
    await this.ensureWoodThicknessPricesTable();
    const id = input.id || uuid();
    await pool.query(
      `INSERT INTO master_wood_thickness_prices
        (id, wood_type, thickness, thickness_uom, length, length_uom, rate_per_cft, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        wood_type = VALUES(wood_type),
        thickness = VALUES(thickness),
        thickness_uom = VALUES(thickness_uom),
        length = VALUES(length),
        length_uom = VALUES(length_uom),
        rate_per_cft = VALUES(rate_per_cft),
        status = VALUES(status),
        deleted_at = NULL`,
      [
        id,
        input.woodType,
        input.thickness,
        input.thicknessUom || "inch",
        input.length,
        input.lengthUom || "feet",
        Number(input.ratePerCft) || 0,
        input.status === "inactive" ? "inactive" : "active",
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_wood_thickness_prices WHERE id = ?", [id]);
    return this.mapWoodThicknessPriceRow(rows[0]);
  }

  async updateWoodThicknessPrice(
    id: string,
    input: {
      woodType: string;
      thickness: string;
      thicknessUom: string;
      length: string;
      lengthUom: string;
      ratePerCft: number;
      status?: string;
    }
  ) {
    await this.ensureWoodThicknessPricesTable();
    await pool.query(
      `UPDATE master_wood_thickness_prices
       SET wood_type = ?, thickness = ?, thickness_uom = ?, length = ?, length_uom = ?, rate_per_cft = ?, status = ?
       WHERE id = ?`,
      [
        input.woodType,
        input.thickness,
        input.thicknessUom || "inch",
        input.length,
        input.lengthUom || "feet",
        Number(input.ratePerCft) || 0,
        input.status === "inactive" ? "inactive" : "active",
        id,
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_wood_thickness_prices WHERE id = ?", [id]);
    return rows[0] ? this.mapWoodThicknessPriceRow(rows[0]) : null;
  }

  async deleteWoodThicknessPrice(id: string) {
    await this.ensureWoodThicknessPricesTable();
    await pool.query("DELETE FROM master_wood_thickness_prices WHERE id = ?", [id]);
  }

  private async ensureHardwareAccessoriesTable() {
    if (this.hwTableEnsured) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_hardware_accessories (
        id VARCHAR(64) PRIMARY KEY,
        item_code VARCHAR(80) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(80) NOT NULL DEFAULT 'Hardware',
        size_spec VARCHAR(150) NULL,
        material_finish VARCHAR(150) NULL,
        uom VARCHAR(50) NOT NULL DEFAULT 'Pc',
        rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_hw_acc_category (category),
        INDEX idx_hw_acc_code (item_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    try {
      await pool.query("ALTER TABLE master_hardware_accessories MODIFY COLUMN id VARCHAR(64) NOT NULL");
    } catch (_err) {
      // Ignore
    }
    await pool.query(
      `INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
        (UUID(), 'Menu: Administration -> Master Data -> Hardware And Accessories', 'Access to Hardware And Accessories module under Master Data', 0)`
    );
    this.hwTableEnsured = true;
  }

  private mapHardwareAccessoryRow(row: any) {
    return {
      id: row.id,
      itemCode: row.item_code,
      itemName: row.item_name,
      category: row.category,
      sizeSpec: row.size_spec || "",
      materialFinish: row.material_finish || "",
      uom: row.uom,
      rate: parseFloat(row.rate ?? 0),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getHardwareAccessories() {
    await this.ensureHardwareAccessoriesTable();
    const [rows]: any = await pool.query(
      "SELECT * FROM master_hardware_accessories WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return (rows || []).map((r: any) => this.mapHardwareAccessoryRow(r));
  }

  async createHardwareAccessory(input: {
    id?: string;
    itemCode: string;
    itemName: string;
    category: string;
    sizeSpec?: string | null;
    materialFinish?: string | null;
    uom: string;
    rate: number;
    status?: string;
  }) {
    await this.ensureHardwareAccessoriesTable();
    const id = input.id || uuid();
    await pool.query(
      `INSERT INTO master_hardware_accessories
        (id, item_code, item_name, category, size_spec, material_finish, uom, rate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        item_code = VALUES(item_code),
        item_name = VALUES(item_name),
        category = VALUES(category),
        size_spec = VALUES(size_spec),
        material_finish = VALUES(material_finish),
        uom = VALUES(uom),
        rate = VALUES(rate),
        status = VALUES(status),
        deleted_at = NULL`,
      [
        id,
        input.itemCode,
        input.itemName,
        input.category || "Hardware",
        input.sizeSpec || null,
        input.materialFinish || null,
        input.uom || "Pc",
        Number(input.rate) || 0,
        input.status === "inactive" ? "inactive" : "active",
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_hardware_accessories WHERE id = ?", [id]);
    return this.mapHardwareAccessoryRow(rows[0]);
  }

  async updateHardwareAccessory(
    id: string,
    input: {
      itemCode: string;
      itemName: string;
      category: string;
      sizeSpec?: string | null;
      materialFinish?: string | null;
      uom: string;
      rate: number;
      status?: string;
    }
  ) {
    await this.ensureHardwareAccessoriesTable();
    await pool.query(
      `UPDATE master_hardware_accessories
       SET item_code = ?, item_name = ?, category = ?, size_spec = ?, material_finish = ?, uom = ?, rate = ?, status = ?
       WHERE id = ?`,
      [
        input.itemCode,
        input.itemName,
        input.category || "Hardware",
        input.sizeSpec || null,
        input.materialFinish || null,
        input.uom || "Pc",
        Number(input.rate) || 0,
        input.status === "inactive" ? "inactive" : "active",
        id,
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_hardware_accessories WHERE id = ?", [id]);
    return rows[0] ? this.mapHardwareAccessoryRow(rows[0]) : null;
  }

  async deleteHardwareAccessory(id: string) {
    await this.ensureHardwareAccessoriesTable();
    try {
      await pool.query("DELETE FROM master_hardware_accessories WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query(
          "UPDATE master_hardware_accessories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
          [id]
        );
      } else throw err;
    }
  }

  private acTableEnsured = false;

  private async ensureAdditionalCostsTable() {
    if (this.acTableEnsured) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_additional_costs (
        id VARCHAR(64) PRIMARY KEY,
        item_code VARCHAR(80) NOT NULL DEFAULT '',
        item_name VARCHAR(255) NOT NULL,
        price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        uom VARCHAR(50) NOT NULL DEFAULT '',
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_add_cost_code (item_code),
        INDEX idx_add_cost_name (item_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    try {
      await pool.query(
        `ALTER TABLE master_additional_costs ADD COLUMN uom VARCHAR(50) NOT NULL DEFAULT '' AFTER price`
      );
    } catch (err: any) {
      if (err?.code !== "ER_DUP_FIELDNAME" && err?.errno !== 1060) {
        throw err;
      }
    }
    await pool.query(
      `INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
        (UUID(), 'Menu: Administration -> Master Data -> Costing Master -> Additional Cost', 'Access to Additional Cost module under Costing Master', 0),
        (UUID(), 'Menu: Administration -> Master Data -> Additional Cost', 'Access to Additional Cost module under Master Data', 0)`
    );
    this.acTableEnsured = true;
  }

  private mapAdditionalCostRow(row: any) {
    return {
      id: row.id,
      itemCode: row.item_code || "",
      itemName: row.item_name,
      price: parseFloat(row.price ?? 0),
      uom: row.uom || "",
      status: row.status || "active",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAdditionalCosts() {
    await this.ensureAdditionalCostsTable();
    const [rows]: any = await pool.query(
      "SELECT * FROM master_additional_costs WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return (rows || []).map((r: any) => this.mapAdditionalCostRow(r));
  }

  async createAdditionalCost(input: {
    id?: string;
    itemCode: string;
    itemName: string;
    price: number;
    uom?: string;
    status?: string;
  }) {
    await this.ensureAdditionalCostsTable();
    const id = input.id || uuid();
    await pool.query(
      `INSERT INTO master_additional_costs (id, item_code, item_name, price, uom, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        item_code = VALUES(item_code),
        item_name = VALUES(item_name),
        price = VALUES(price),
        uom = VALUES(uom),
        status = VALUES(status),
        deleted_at = NULL`,
      [
        id,
        input.itemCode,
        input.itemName,
        Number(input.price) || 0,
        input.uom || "",
        input.status === "inactive" ? "inactive" : "active",
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_additional_costs WHERE id = ?", [id]);
    return this.mapAdditionalCostRow(rows[0]);
  }

  async updateAdditionalCost(
    id: string,
    input: {
      itemCode: string;
      itemName: string;
      price: number;
      uom?: string;
      status?: string;
    }
  ) {
    await this.ensureAdditionalCostsTable();
    await pool.query(
      `UPDATE master_additional_costs
       SET item_code = ?, item_name = ?, price = ?, uom = ?, status = ?
       WHERE id = ?`,
      [
        input.itemCode,
        input.itemName,
        Number(input.price) || 0,
        input.uom || "",
        input.status === "inactive" ? "inactive" : "active",
        id,
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_additional_costs WHERE id = ?", [id]);
    return rows[0] ? this.mapAdditionalCostRow(rows[0]) : null;
  }

  async deleteAdditionalCost(id: string) {
    await this.ensureAdditionalCostsTable();
    try {
      await pool.query("DELETE FROM master_additional_costs WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query(
          "UPDATE master_additional_costs SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
          [id]
        );
      } else throw err;
    }
  }

  private mdfTableEnsured = false;

  private async ensureMdfPricesTable() {
    if (this.mdfTableEnsured) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_mdf_prices (
        id VARCHAR(64) PRIMARY KEY,
        mdf_type VARCHAR(150) NOT NULL,
        sheet_size VARCHAR(80) NOT NULL DEFAULT '',
        thickness VARCHAR(50) NOT NULL DEFAULT '',
        price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        uom VARCHAR(50) NOT NULL DEFAULT '',
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_mdf_type (mdf_type),
        INDEX idx_mdf_thickness (thickness)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.query(
      `INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
        (UUID(), 'Menu: Administration -> Master Data -> Costing Master -> MDF Prices', 'Access to MDF Prices module under Costing Master', 0),
        (UUID(), 'Menu: Administration -> Master Data -> MDF Prices', 'Access to MDF Prices module under Master Data', 0)`
    );
    this.mdfTableEnsured = true;
  }

  private mapMdfPriceRow(row: any) {
    return {
      id: row.id,
      mdfType: row.mdf_type || "",
      sheetSize: row.sheet_size || "",
      thickness: row.thickness || "",
      price: parseFloat(row.price ?? 0),
      uom: row.uom || "",
      status: row.status || "active",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getMdfPrices() {
    await this.ensureMdfPricesTable();
    const [rows]: any = await pool.query(
      "SELECT * FROM master_mdf_prices WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return (rows || []).map((r: any) => this.mapMdfPriceRow(r));
  }

  async createMdfPrice(input: {
    id?: string;
    mdfType: string;
    sheetSize: string;
    thickness: string;
    price: number;
    uom?: string;
    status?: string;
  }) {
    await this.ensureMdfPricesTable();
    const id = input.id || uuid();
    await pool.query(
      `INSERT INTO master_mdf_prices (id, mdf_type, sheet_size, thickness, price, uom, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        mdf_type = VALUES(mdf_type),
        sheet_size = VALUES(sheet_size),
        thickness = VALUES(thickness),
        price = VALUES(price),
        uom = VALUES(uom),
        status = VALUES(status),
        deleted_at = NULL`,
      [
        id,
        input.mdfType,
        input.sheetSize || "",
        input.thickness || "",
        Number(input.price) || 0,
        input.uom || "",
        input.status === "inactive" ? "inactive" : "active",
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_mdf_prices WHERE id = ?", [id]);
    return this.mapMdfPriceRow(rows[0]);
  }

  async updateMdfPrice(
    id: string,
    input: {
      mdfType: string;
      sheetSize: string;
      thickness: string;
      price: number;
      uom?: string;
      status?: string;
    }
  ) {
    await this.ensureMdfPricesTable();
    await pool.query(
      `UPDATE master_mdf_prices
       SET mdf_type = ?, sheet_size = ?, thickness = ?, price = ?, uom = ?, status = ?
       WHERE id = ?`,
      [
        input.mdfType,
        input.sheetSize || "",
        input.thickness || "",
        Number(input.price) || 0,
        input.uom || "",
        input.status === "inactive" ? "inactive" : "active",
        id,
      ]
    );
    const [rows]: any = await pool.query("SELECT * FROM master_mdf_prices WHERE id = ?", [id]);
    return rows[0] ? this.mapMdfPriceRow(rows[0]) : null;
  }

  async deleteMdfPrice(id: string) {
    await this.ensureMdfPricesTable();
    try {
      await pool.query("DELETE FROM master_mdf_prices WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query(
          "UPDATE master_mdf_prices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
          [id]
        );
      } else throw err;
    }
  }
}
