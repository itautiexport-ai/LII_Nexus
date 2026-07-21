"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlMasterDataRepository = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const uuid_1 = require("uuid");
class MySqlMasterDataRepository {
    // Wood Types
    async getWoodTypes() {
        const [rows] = await connection_1.pool.query("SELECT * FROM wood_types WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows;
    }
    async createWoodType(name) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO wood_types (id, name) VALUES (?, ?)", [id, name]);
        const [rows] = await connection_1.pool.query("SELECT * FROM wood_types WHERE id = ?", [id]);
        return rows[0];
    }
    async updateWoodType(id, name, status) {
        await connection_1.pool.query("UPDATE wood_types SET name = ?, status = ? WHERE id = ?", [name, status, id]);
        const [rows] = await connection_1.pool.query("SELECT * FROM wood_types WHERE id = ?", [id]);
        return rows[0];
    }
    async deleteWoodType(id) {
        try {
            await connection_1.pool.query("DELETE FROM wood_types WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE wood_types SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
            }
            else
                throw err;
        }
    }
    // Priorities
    async getPriorities() {
        const [rows] = await connection_1.pool.query("SELECT * FROM priorities WHERE deleted_at IS NULL ORDER BY created_at ASC");
        return rows;
    }
    async createPriority(name, colorCode) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO priorities (id, name, color_code) VALUES (?, ?, ?)", [id, name, colorCode]);
        const [rows] = await connection_1.pool.query("SELECT * FROM priorities WHERE id = ?", [id]);
        return rows[0];
    }
    async updatePriority(id, name, colorCode, status) {
        await connection_1.pool.query("UPDATE priorities SET name = ?, color_code = ?, status = ? WHERE id = ?", [name, colorCode, status, id]);
        const [rows] = await connection_1.pool.query("SELECT * FROM priorities WHERE id = ?", [id]);
        return rows[0];
    }
    async deletePriority(id) {
        try {
            await connection_1.pool.query("DELETE FROM priorities WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE priorities SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
            }
            else
                throw err;
        }
    }
    // Buyers
    async getBuyers() {
        const [rows] = await connection_1.pool.query("SELECT * FROM master_data_buyers WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows;
    }
    async createBuyer(name) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO master_data_buyers (id, name) VALUES (?, ?)", [id, name]);
        const [rows] = await connection_1.pool.query("SELECT * FROM master_data_buyers WHERE id = ?", [id]);
        return rows[0];
    }
    async updateBuyer(id, name) {
        await connection_1.pool.query("UPDATE master_data_buyers SET name = ? WHERE id = ?", [name, id]);
        const [rows] = await connection_1.pool.query("SELECT * FROM master_data_buyers WHERE id = ?", [id]);
        return rows[0];
    }
    async deleteBuyer(id) {
        try {
            await connection_1.pool.query("DELETE FROM master_data_buyers WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE master_data_buyers SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
            }
            else
                throw err;
        }
    }
    // UOMs
    async getUoms() {
        const [rows] = await connection_1.pool.query("SELECT * FROM uoms WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows;
    }
    async createUom(name) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO uoms (id, name) VALUES (?, ?)", [id, name]);
        const [rows] = await connection_1.pool.query("SELECT * FROM uoms WHERE id = ?", [id]);
        return rows[0];
    }
    async updateUom(id, name) {
        await connection_1.pool.query("UPDATE uoms SET name = ? WHERE id = ?", [name, id]);
        const [rows] = await connection_1.pool.query("SELECT * FROM uoms WHERE id = ?", [id]);
        return rows[0];
    }
    async deleteUom(id) {
        try {
            await connection_1.pool.query("DELETE FROM uoms WHERE id = ?", [id]);
        }
        catch (err) {
            if (err.code === "ER_ROW_IS_REFERENCED_2") {
                await connection_1.pool.query("UPDATE uoms SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
            }
            else
                throw err;
        }
    }
    // HODs
    async getHods() {
        const [rows] = await connection_1.pool.query("SELECT * FROM master_hods ORDER BY name ASC");
        return rows;
    }
    async createHod(name) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO master_hods (id, name) VALUES (?, ?)", [id, name]);
        const [rows] = await connection_1.pool.query("SELECT * FROM master_hods WHERE id = ?", [id]);
        return rows[0];
    }
    async updateHod(id, name) {
        await connection_1.pool.query("UPDATE master_hods SET name = ? WHERE id = ?", [name, id]);
        const [rows] = await connection_1.pool.query("SELECT * FROM master_hods WHERE id = ?", [id]);
        return rows[0];
    }
    async deleteHod(id) {
        await connection_1.pool.query("DELETE FROM master_hods WHERE id = ?", [id]);
    }
    // Merchants
    async getMerchants() {
        const [rows] = await connection_1.pool.query("SELECT * FROM master_merchants ORDER BY name ASC");
        return rows;
    }
    async createMerchant(name, status = 'active') {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO master_merchants (id, name, status) VALUES (?, ?, ?)", [id, name, status]);
        const [rows] = await connection_1.pool.query("SELECT * FROM master_merchants WHERE id = ?", [id]);
        return rows[0];
    }
    async updateMerchant(id, name, status) {
        await connection_1.pool.query("UPDATE master_merchants SET name = ?, status = ? WHERE id = ?", [name, status, id]);
        const [rows] = await connection_1.pool.query("SELECT * FROM master_merchants WHERE id = ?", [id]);
        return rows[0];
    }
    async deleteMerchant(id) {
        await connection_1.pool.query("DELETE FROM master_merchants WHERE id = ?", [id]);
    }
}
exports.MySqlMasterDataRepository = MySqlMasterDataRepository;
//# sourceMappingURL=MySqlMasterDataRepository.js.map