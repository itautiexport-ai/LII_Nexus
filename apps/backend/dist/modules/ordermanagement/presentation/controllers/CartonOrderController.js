"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartonOrderController = void 0;
const cartonOrder_dto_1 = require("../../application/dto/cartonOrder.dto");
class CartonOrderController {
    constructor(service) {
        this.service = service;
        this.create = async (req, res) => {
            try {
                const dto = cartonOrder_dto_1.CreateCartonOrderSchema.parse(req.body);
                const cartonOrder = await this.service.create(dto);
                res.status(201).json({ success: true, data: cartonOrder });
            }
            catch (err) {
                if (err.errors) {
                    return res.status(400).json({ success: false, errors: err.errors });
                }
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.getAll = async (req, res) => {
            try {
                const orders = await this.service.getAll();
                res.json({ success: true, data: orders });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
    }
}
exports.CartonOrderController = CartonOrderController;
//# sourceMappingURL=CartonOrderController.js.map