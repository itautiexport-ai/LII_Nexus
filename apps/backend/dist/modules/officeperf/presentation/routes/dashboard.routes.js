"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardController_1 = require("../controllers/DashboardController");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Employee/manager dashboards are self-service (resolved from the caller's
// own employee record) - no flat permission needed, same reasoning as
// My Goals / My Reviews elsewhere in this app.
router.get("/dashboard/employee", (0, asyncHandler_1.asyncHandler)(DashboardController_1.DashboardController.employee));
router.get("/dashboard/manager", (0, asyncHandler_1.asyncHandler)(DashboardController_1.DashboardController.manager));
// Department and company dashboards are broader oversight views and are
// permission-gated.
router.get("/dashboard/department/:departmentId", (0, rbac_middleware_1.requirePermission)("performance.dashboard.department.view"), (0, asyncHandler_1.asyncHandler)(DashboardController_1.DashboardController.department));
router.get("/dashboard/company", (0, rbac_middleware_1.requirePermission)("performance.dashboard.company.view"), (0, asyncHandler_1.asyncHandler)(DashboardController_1.DashboardController.company));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map