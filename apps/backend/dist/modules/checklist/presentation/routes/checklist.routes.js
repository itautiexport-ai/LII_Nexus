"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const StandaloneChecklistController_1 = require("../controllers/StandaloneChecklistController");
const StandaloneChecklistService_1 = require("../../application/services/StandaloneChecklistService");
const router = (0, express_1.Router)();
const service = new StandaloneChecklistService_1.StandaloneChecklistService();
const controller = new StandaloneChecklistController_1.StandaloneChecklistController(service);
router.post("/standalone-checklists", auth_middleware_1.authMiddleware, controller.createChecklist);
router.get("/standalone-checklists", auth_middleware_1.authMiddleware, controller.getAllChecklists);
router.delete("/standalone-checklists/:id", auth_middleware_1.authMiddleware, controller.deleteChecklist);
exports.default = router;
//# sourceMappingURL=checklist.routes.js.map