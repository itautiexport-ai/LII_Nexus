"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlMachineProductRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
class MySqlMachineProductRepository {
    async listMachines() {
        const [rows] = await connection_1.pool.query("SELECT * FROM machines WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows.map((r) => ({ id: r.id, name: r.name, code: r.code, factoryDepartmentId: r.factory_department_id, status: r.status }));
    }
    async createMachine(name, code, factoryDepartmentId) {
        const id = (0, uuid_1.v4)();
        try {
            await connection_1.pool.query("INSERT INTO machines (id, name, code, factory_department_id) VALUES (?, ?, ?, ?)", [id, name, code, factoryDepartmentId]);
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                throw new DomainError_1.ConflictError("A machine with this name or code already exists.");
            throw err;
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM machines WHERE id = ?", [id]);
        const r = rows[0];
        return { id: r.id, name: r.name, code: r.code, factoryDepartmentId: r.factory_department_id, status: r.status };
    }
    async updateMachineStatus(id, status) {
        await connection_1.pool.query("UPDATE machines SET status = ? WHERE id = ?", [status, id]);
    }
    async updateMachine(id, name, code) {
        try {
            await connection_1.pool.query("UPDATE machines SET name = ?, code = ? WHERE id = ?", [name, code, id]);
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                throw new DomainError_1.ConflictError("A machine with this name or code already exists.");
            throw err;
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM machines WHERE id = ?", [id]);
        const r = rows[0];
        return { id: r.id, name: r.name, code: r.code, factoryDepartmentId: r.factory_department_id, status: r.status };
    }
    async listProducts() {
        const [rows] = await connection_1.pool.query("SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC");
        return rows.map((r) => ({ id: r.id, name: r.name, sku: r.sku, status: r.status }));
    }
    async createProduct(name, sku) {
        const id = (0, uuid_1.v4)();
        try {
            await connection_1.pool.query("INSERT INTO products (id, name, sku) VALUES (?, ?, ?)", [id, name, sku]);
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                throw new DomainError_1.ConflictError("A product with this name or SKU already exists.");
            throw err;
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM products WHERE id = ?", [id]);
        const r = rows[0];
        return { id: r.id, name: r.name, sku: r.sku, status: r.status };
    }
    async updateProductStatus(id, status) {
        await connection_1.pool.query("UPDATE products SET status = ? WHERE id = ?", [status, id]);
    }
    async updateProduct(id, name, sku) {
        try {
            await connection_1.pool.query("UPDATE products SET name = ?, sku = ? WHERE id = ?", [name, sku, id]);
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                throw new DomainError_1.ConflictError("A product with this name or SKU already exists.");
            throw err;
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM products WHERE id = ?", [id]);
        const r = rows[0];
        return { id: r.id, name: r.name, sku: r.sku, status: r.status };
    }
}
exports.MySqlMachineProductRepository = MySqlMachineProductRepository;
//# sourceMappingURL=MySqlMachineProductRepository.js.map