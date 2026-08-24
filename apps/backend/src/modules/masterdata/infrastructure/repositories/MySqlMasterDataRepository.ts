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

  async createBuyer(name: string) {
    const id = uuid();
    await pool.query("INSERT INTO master_data_buyers (id, name) VALUES (?, ?)", [id, name]);
    const [rows]: any = await pool.query("SELECT * FROM master_data_buyers WHERE id = ?", [id]);
    return rows[0];
  }

  async updateBuyer(id: string, name: string) {
    await pool.query("UPDATE master_data_buyers SET name = ? WHERE id = ?", [name, id]);
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
    const [rows] = await pool.query("SELECT * FROM master_hods ORDER BY name ASC");
    return rows;
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
}
