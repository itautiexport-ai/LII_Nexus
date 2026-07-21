import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Employee/manager dashboards are self-service (resolved from the caller's
// own employee record) - no flat permission needed, same reasoning as
// My Goals / My Reviews elsewhere in this app.
router.get("/dashboard/employee", asyncHandler(DashboardController.employee));
router.get("/dashboard/manager", asyncHandler(DashboardController.manager));

// Department and company dashboards are broader oversight views and are
// permission-gated.
router.get("/dashboard/department/:departmentId", requirePermission("performance.dashboard.department.view"), asyncHandler(DashboardController.department));
router.get("/dashboard/company", requirePermission("performance.dashboard.company.view"), asyncHandler(DashboardController.company));

export default router;
