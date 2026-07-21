"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderInHandService = void 0;
const MySqlOrderInHandRepository_1 = require("../../infrastructure/repositories/MySqlOrderInHandRepository");
class OrderInHandService {
    constructor() {
        this.repository = new MySqlOrderInHandRepository_1.MySqlOrderInHandRepository();
    }
    async getAllOrders() {
        return this.repository.findAll();
    }
    async getOrderById(id) {
        return this.repository.findById(id);
    }
    async createOrder(data) {
        return this.repository.create(data);
    }
    async updateOrder(id, data) {
        return this.repository.update(id, data);
    }
    async deleteOrder(id) {
        return this.repository.delete(id);
    }
}
exports.OrderInHandService = OrderInHandService;
//# sourceMappingURL=OrderInHandService.js.map