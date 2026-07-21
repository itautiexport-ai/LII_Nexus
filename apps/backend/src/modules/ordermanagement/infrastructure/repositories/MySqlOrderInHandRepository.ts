import { pool } from "../../../../infrastructure/database/mysql/connection";
import { OrderInHand } from "../../domain/entities/OrderInHand";
import { CreateOrderInHandDTO, UpdateOrderInHandDTO } from "../../application/dto/orderInHand.dto";
import { v4 as uuid } from "uuid";

export class MySqlOrderInHandRepository {
  async findAll(): Promise<OrderInHand[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM orders_in_hand ORDER BY created_at DESC");
    return rows.map(this.mapToEntity);
  }

  async findById(id: string): Promise<OrderInHand | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM orders_in_hand WHERE id = ?", [id]);
    if (!rows[0]) return null;
    return this.mapToEntity(rows[0]);
  }

  async generateOrderId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const [rows] = await pool.query<any[]>(
      "SELECT order_id FROM orders_in_hand WHERE order_id LIKE ? ORDER BY order_id DESC LIMIT 1",
      [`${prefix}%`]
    );
    if (!rows[0]) {
      return `${prefix}00001`;
    }
    const lastId = rows[0].order_id;
    const lastNumber = parseInt(lastId.split("-")[2], 10);
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  async create(data: CreateOrderInHandDTO): Promise<OrderInHand> {
    const id = uuid();
    const orderId = await this.generateOrderId();

    // Auto-calculate expected dispatch date
    if (data.exFactoryDate) {
      const exFactory = new Date(data.exFactoryDate);
      exFactory.setDate(exFactory.getDate() + 7);
      data.expectedDispatchDate = exFactory.toISOString().split('T')[0];
    }

    await pool.query(
      `INSERT INTO orders_in_hand (
        id, order_id, order_date, customer_name, country, merchant_name, erp_number, ex_factory_date, marketplace,
        po_number, no_of_products, total_qty, order_value, currency, payment_status,
        production_status, qc_status, packing_status, dispatch_status, expected_dispatch_date,
        expected_delivery, priority, delay_days, current_stage, overall_progress, overall_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, orderId, data.orderDate, data.customerName, data.country ?? null,
        data.merchantName, data.erpNumber ?? null, data.exFactoryDate ?? null, data.marketplace ?? null, data.poNumber ?? null,
        data.noOfProducts ?? null, data.totalQty ?? null, data.orderValue ?? null,
        data.currency ?? null, data.paymentStatus ?? null, data.productionStatus ?? null,
        data.qcStatus ?? null, data.packingStatus ?? null, data.dispatchStatus ?? null,
        data.expectedDispatchDate ?? null, data.expectedDelivery ?? null, data.priority ?? null,
        data.delayDays ?? null, data.currentStage ?? null, data.overallProgress ?? null, data.overallStatus ?? 'Under Process'
      ]
    );

    return this.findById(id) as Promise<OrderInHand>;
  }

  async update(id: string, data: UpdateOrderInHandDTO): Promise<OrderInHand | null> {
    // Auto-calculate expected dispatch date if exFactoryDate is updated
    if (data.exFactoryDate) {
      const exFactory = new Date(data.exFactoryDate);
      exFactory.setDate(exFactory.getDate() + 7);
      data.expectedDispatchDate = exFactory.toISOString().split('T')[0];
    }

    const updates: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      orderDate: 'order_date',
      customerName: 'customer_name',
      country: 'country',
      merchantName: 'merchant_name',
      erpNumber: 'erp_number',
      exFactoryDate: 'ex_factory_date',
      marketplace: 'marketplace',
      poNumber: 'po_number',
      noOfProducts: 'no_of_products',
      totalQty: 'total_qty',
      orderValue: 'order_value',
      currency: 'currency',
      paymentStatus: 'payment_status',
      productionStatus: 'production_status',
      qcStatus: 'qc_status',
      packingStatus: 'packing_status',
      dispatchStatus: 'dispatch_status',
      expectedDispatchDate: 'expected_dispatch_date',
      expectedDelivery: 'expected_delivery',
      priority: 'priority',
      delayDays: 'delay_days',
      currentStage: 'current_stage',
      overallProgress: 'overall_progress',
      overallStatus: 'overall_status'
    };

    for (const [key, value] of Object.entries(data)) {
      if (fieldMap[key]) {
        updates.push(`${fieldMap[key]} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE orders_in_hand SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM orders_in_hand WHERE id = ?", [id]);
  }

  private mapToEntity(row: any): OrderInHand {
    return {
      id: row.id,
      orderId: row.order_id,
      orderDate: row.order_date instanceof Date ? row.order_date.toISOString().split('T')[0] : row.order_date,
      customerName: row.customer_name,
      country: row.country,
      merchantName: row.merchant_name,
      erpNumber: row.erp_number,
      exFactoryDate: row.ex_factory_date instanceof Date ? row.ex_factory_date.toISOString().split('T')[0] : row.ex_factory_date,
      marketplace: row.marketplace,
      poNumber: row.po_number,
      noOfProducts: row.no_of_products,
      totalQty: row.total_qty,
      orderValue: row.order_value,
      currency: row.currency,
      paymentStatus: row.payment_status,
      productionStatus: row.production_status,
      qcStatus: row.qc_status,
      packingStatus: row.packing_status,
      dispatchStatus: row.dispatch_status,
      expectedDispatchDate: row.expected_dispatch_date instanceof Date ? row.expected_dispatch_date.toISOString().split('T')[0] : row.expected_dispatch_date,
      expectedDelivery: row.expected_delivery instanceof Date ? row.expected_delivery.toISOString().split('T')[0] : row.expected_delivery,
      priority: row.priority,
      delayDays: row.delay_days,
      currentStage: row.current_stage,
      overallProgress: row.overall_progress,
      overallStatus: row.overall_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
