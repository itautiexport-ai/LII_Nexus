"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CommandCenterController_1 = require("../controllers/CommandCenterController");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get("/command-center/overview", (0, rbac_middleware_1.requirePermission)("commandcenter.view"), (0, asyncHandler_1.asyncHandler)(CommandCenterController_1.CommandCenterController.getOverview));
exports.default = router;
//# sourceMappingURL=commandcenter.routes.js.map