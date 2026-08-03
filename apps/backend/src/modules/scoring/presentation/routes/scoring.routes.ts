import { Router } from "express";
import { KpiDefinitionController } from "../controllers/KpiDefinitionController";
import { ScoreController } from "../controllers/ScoreController";
import { createKpiSchema, updateKpiSchema, setDepartmentWeightageSchema, recordManualScoreSchema } from "../../application/dto/kpi.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// KPI Definitions
router.get("/kpi-definitions", requirePermission("kpi.definition.view"), asyncHandler(KpiDefinitionController.list));
router.get("/kpi-definitions/:id", requirePermission("kpi.definition.view"), asyncHandler(KpiDefinitionController.getDetail));
router.post("/kpi-definitions", requirePermission("kpi.definition.create"), validate(createKpiSchema), asyncHandler(KpiDefinitionController.create));
router.patch("/kpi-definitions/:id", requirePermission("kpi.definition.update"), validate(updateKpiSchema), asyncHandler(KpiDefinitionController.update));
router.delete("/kpi-definitions/:id", requirePermission("kpi.definition.delete"), asyncHandler(KpiDefinitionController.remove));
router.put("/kpi-definitions/:id/department-weightage", requirePermission("kpi.weightage.manage"), validate(setDepartmentWeightageSchema), asyncHandler(KpiDefinitionController.setDepartmentWeightage));
router.delete("/kpi-definitions/:id/department-weightage/:departmentId", requirePermission("kpi.weightage.manage"), asyncHandler(KpiDefinitionController.removeDepartmentWeightage));

// Scores - self-service first (literal paths), then override-permission
// paths, ranking last. /scores/me and /scores/rankings/* are literal and
// registered before /scores/employees/:employeeId to avoid any risk of the
// route-ordering bug this project has hit twice before.
router.get("/scores/me", asyncHandler(ScoreController.getMyScore));
router.get("/scores/me/trend", asyncHandler(ScoreController.getMyTrend));
router.get("/scores/rankings/top-performers", requirePermission("kpi.ranking.view"), asyncHandler(ScoreController.topPerformers));
router.get("/scores/rankings/bottom-performers", requirePermission("kpi.ranking.view"), asyncHandler(ScoreController.bottomPerformers));
router.get("/scores/rankings/departments", requirePermission("kpi.ranking.view"), asyncHandler(ScoreController.departmentRanking));
router.post("/scores/manual-entry", requirePermission("kpi.score.manual_entry"), validate(recordManualScoreSchema), asyncHandler(ScoreController.recordManualScore));
router.get("/scores/employees/:employeeId", requirePermission("kpi.score.view"), asyncHandler(ScoreController.getEmployeeScore));
router.get("/scores/employees/:employeeId/trend", requirePermission("kpi.score.view"), asyncHandler(ScoreController.getEmployeeTrend));

export default router;
