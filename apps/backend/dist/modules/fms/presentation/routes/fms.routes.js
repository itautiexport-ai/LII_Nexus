"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FmsManagerController_1 = require("../controllers/FmsManagerController");
const FmsManagerService_1 = require("../../application/services/FmsManagerService");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const { pool } = require("../../../../infrastructure/database/mysql/connection");
const router = (0, express_1.Router)();
const service = new FmsManagerService_1.FmsManagerService(pool);
const controller = new FmsManagerController_1.FmsManagerController(service);
router.post("/fms", auth_middleware_1.authMiddleware, controller.createFms);
router.get("/fms", auth_middleware_1.authMiddleware, controller.getAllFms);
router.delete("/fms/:id", auth_middleware_1.authMiddleware, controller.deleteFms);
router.post("/fms/:fmsId/steps", auth_middleware_1.authMiddleware, controller.addStep);
router.get("/fms/:fmsId/steps", auth_middleware_1.authMiddleware, controller.getSteps);
router.delete("/fms/steps/:stepId", auth_middleware_1.authMiddleware, controller.deleteStep);
exports.default = router;
//# sourceMappingURL=fms.routes.js.map