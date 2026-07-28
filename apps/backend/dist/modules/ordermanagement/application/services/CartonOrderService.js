"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartonOrderService = void 0;
const uuid_1 = require("uuid");
class CartonOrderService {
    constructor(dbPool) {
        this.dbPool = dbPool;
    }
    async create(dto) {
        const id = (0, uuid_1.v4)();
        const query = `
      INSERT INTO buyer_carton_orders (id, erp_order_number, company_name, alias_name)
      VALUES (?, ?, ?, ?)
    `;
        const params = [
            id,
            dto.erpOrderNumber,
            dto.companyName || null,
            dto.aliasName || null
        ];
        await this.dbPool.query(query, params);
        const [rows] = await this.dbPool.query("SELECT * FROM buyer_carton_orders WHERE id = ?", [id]);
        return this.mapToEntity(rows[0]);
    }
    async getAll() {
        const [rows] = await this.dbPool.query("SELECT * FROM buyer_carton_orders ORDER BY created_at DESC");
        return rows.map(this.mapToEntity);
    }
    mapToEntity(row) {
        return {
            id: row.id,
            erpOrderNumber: row.erp_order_number,
            companyName: row.company_name,
            aliasName: row.alias_name,
            createdAt: row.created_at,
        };
    }
}
exports.CartonOrderService = CartonOrderService;
//# sourceMappingURL=CartonOrderService.js.map