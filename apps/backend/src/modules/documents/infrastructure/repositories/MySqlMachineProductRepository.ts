import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Machine, MasterStatus, Product } from "../../domain/entities/Document";
import { ConflictError } from "../../../../core/domain/errors/DomainError";

export class MySqlMachineProductRepository {
  async listMachines(): Promise<Machine[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM machines WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows.map((r) => ({ id: r.id, name: r.name, code: r.code, factoryDepartmentId: r.factory_department_id, status: r.status }));
  }

  async createMachine(name: string, code: string | null, factoryDepartmentId: string | null): Promise<Machine> {
    const id = uuid();
    try {
      await pool.query("INSERT INTO machines (id, name, code, factory_department_id) VALUES (?, ?, ?, ?)", [id, name, code, factoryDepartmentId]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A machine with this name or code already exists.");
      throw err;
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM machines WHERE id = ?", [id]);
    const r = rows[0];
    return { id: r.id, name: r.name, code: r.code, factoryDepartmentId: r.factory_department_id, status: r.status };
  }

  async updateMachineStatus(id: string, status: MasterStatus): Promise<void> {
    await pool.query("UPDATE machines SET status = ? WHERE id = ?", [status, id]);
  }

  async updateMachine(id: string, name: string, code: string | null): Promise<Machine> {
    try {
      await pool.query("UPDATE machines SET name = ?, code = ? WHERE id = ?", [name, code, id]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A machine with this name or code already exists.");
      throw err;
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM machines WHERE id = ?", [id]);
    const r = rows[0];
    return { id: r.id, name: r.name, code: r.code, factoryDepartmentId: r.factory_department_id, status: r.status };
  }

  async listProducts(): Promise<Product[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC");
    return rows.map((r) => ({ id: r.id, name: r.name, sku: r.sku, status: r.status }));
  }

  async createProduct(name: string, sku: string | null): Promise<Product> {
    const id = uuid();
    try {
      await pool.query("INSERT INTO products (id, name, sku) VALUES (?, ?, ?)", [id, name, sku]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A product with this name or SKU already exists.");
      throw err;
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM products WHERE id = ?", [id]);
    const r = rows[0];
    return { id: r.id, name: r.name, sku: r.sku, status: r.status };
  }

  async updateProductStatus(id: string, status: MasterStatus): Promise<void> {
    await pool.query("UPDATE products SET status = ? WHERE id = ?", [status, id]);
  }

  async updateProduct(id: string, name: string, sku: string | null): Promise<Product> {
    try {
      await pool.query("UPDATE products SET name = ?, sku = ? WHERE id = ?", [name, sku, id]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") throw new ConflictError("A product with this name or SKU already exists.");
      throw err;
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM products WHERE id = ?", [id]);
    const r = rows[0];
    return { id: r.id, name: r.name, sku: r.sku, status: r.status };
  }
}
