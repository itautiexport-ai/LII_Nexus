import { v4 as uuidv4 } from "uuid";
import { CreateCartonOrderDto } from "../dto/cartonOrder.dto";

export interface CartonOrderEntity {
  id: string;
  erpOrderNumber: string;
  companyName?: string;
  aliasName?: string;
  createdAt: string;
}

export class CartonOrderService {
  constructor(private dbPool: any) {}

  async create(dto: CreateCartonOrderDto): Promise<CartonOrderEntity> {
    const id = uuidv4();
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

  async getAll(): Promise<CartonOrderEntity[]> {
    const [rows] = await this.dbPool.query("SELECT * FROM buyer_carton_orders ORDER BY created_at DESC");
    return rows.map(this.mapToEntity);
  }

  private mapToEntity(row: any): CartonOrderEntity {
    return {
      id: row.id,
      erpOrderNumber: row.erp_order_number,
      companyName: row.company_name,
      aliasName: row.alias_name,
      createdAt: row.created_at,
    };
  }
}
