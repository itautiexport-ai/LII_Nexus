"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CartonOrderController_1 = require("../controllers/CartonOrderController");
const CartonOrderService_1 = require("../../application/services/CartonOrderService");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const service = new CartonOrderService_1.CartonOrderService(connection_1.pool);
const controller = new CartonOrderController_1.CartonOrderController(service);
router.post("/carton-orders", auth_middleware_1.authMiddleware, controller.create);
router.get("/carton-orders", auth_middleware_1.authMiddleware, controller.getAll);
exports.default = router;
//# sourceMappingURL=cartonOrder.routes.js.map