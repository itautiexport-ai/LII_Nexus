"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderInHandController = void 0;
const OrderInHandService_1 = require("../../application/services/OrderInHandService");
class OrderInHandController {
    constructor() {
        this.service = new OrderInHandService_1.OrderInHandService();
        this.getAll = async (req, res) => {
            try {
                const orders = await this.service.getAllOrders();
                res.json(orders);
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
        this.getById = async (req, res) => {
            try {
                const order = await this.service.getOrderById(req.params.id);
                if (!order)
                    return res.status(404).json({ error: "Order not found" });
                res.json(order);
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
        this.create = async (req, res) => {
            try {
                const order = await this.service.createOrder(req.body);
                res.status(201).json(order);
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
        this.update = async (req, res) => {
            try {
                const order = await this.service.updateOrder(req.params.id, req.body);
                if (!order)
                    return res.status(404).json({ error: "Order not found" });
                res.json(order);
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
        this.delete = async (req, res) => {
            try {
                await this.service.deleteOrder(req.params.id);
                res.status(204).send();
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
    }
}
exports.OrderInHandController = OrderInHandController;
//# sourceMappingURL=OrderInHandController.js.map