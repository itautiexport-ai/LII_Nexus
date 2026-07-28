"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const TaskCenterController_1 = require("../controllers/TaskCenterController");
const TaskCenterService_1 = require("../../application/services/TaskCenterService");
const router = (0, express_1.Router)();
const service = new TaskCenterService_1.TaskCenterService();
const controller = new TaskCenterController_1.TaskCenterController(service);
router.get("/stats", auth_middleware_1.authMiddleware, controller.getDashboardStats);
exports.default = router;
//# sourceMappingURL=taskcenter.routes.js.map