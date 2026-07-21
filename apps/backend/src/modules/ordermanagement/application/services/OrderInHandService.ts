import { MySqlOrderInHandRepository } from "../../infrastructure/repositories/MySqlOrderInHandRepository";
import { CreateOrderInHandDTO, UpdateOrderInHandDTO } from "../dto/orderInHand.dto";
import { OrderInHand } from "../../domain/entities/OrderInHand";

export class OrderInHandService {
  private repository = new MySqlOrderInHandRepository();

  async getAllOrders(): Promise<OrderInHand[]> {
    return this.repository.findAll();
  }

  async getOrderById(id: string): Promise<OrderInHand | null> {
    return this.repository.findById(id);
  }

  async createOrder(data: CreateOrderInHandDTO): Promise<OrderInHand> {
    return this.repository.create(data);
  }

  async updateOrder(id: string, data: UpdateOrderInHandDTO): Promise<OrderInHand | null> {
    return this.repository.update(id, data);
  }

  async deleteOrder(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
