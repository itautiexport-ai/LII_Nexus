"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderInHandRoutes = void 0;
const express_1 = require("express");
const OrderInHandController_1 = require("../controllers/OrderInHandController");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
exports.orderInHandRoutes = (0, express_1.Router)();
const controller = new OrderInHandController_1.OrderInHandController();
exports.orderInHandRoutes.use(auth_middleware_1.authMiddleware);
exports.orderInHandRoutes.get("/", controller.getAll);
exports.orderInHandRoutes.get("/:id", controller.getById);
exports.orderInHandRoutes.post("/", controller.create);
exports.orderInHandRoutes.put("/:id", controller.update);
exports.orderInHandRoutes.delete("/:id", controller.delete);
//# sourceMappingURL=orderInHandRoutes.js.map