"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KpiDefinitionController_1 = require("../controllers/KpiDefinitionController");
const ScoreController_1 = require("../controllers/ScoreController");
const kpi_dto_1 = require("../../application/dto/kpi.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// KPI Definitions
router.get("/kpi-definitions", (0, rbac_middleware_1.requirePermission)("kpi.definition.view"), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.list));
router.get("/kpi-definitions/:id", (0, rbac_middleware_1.requirePermission)("kpi.definition.view"), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.getDetail));
router.post("/kpi-definitions", (0, rbac_middleware_1.requirePermission)("kpi.definition.create"), (0, validate_request_middleware_1.validate)(kpi_dto_1.createKpiSchema), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.create));
router.patch("/kpi-definitions/:id", (0, rbac_middleware_1.requirePermission)("kpi.definition.update"), (0, validate_request_middleware_1.validate)(kpi_dto_1.updateKpiSchema), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.update));
router.delete("/kpi-definitions/:id", (0, rbac_middleware_1.requirePermission)("kpi.definition.delete"), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.remove));
router.put("/kpi-definitions/:id/department-weightage", (0, rbac_middleware_1.requirePermission)("kpi.weightage.manage"), (0, validate_request_middleware_1.validate)(kpi_dto_1.setDepartmentWeightageSchema), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.setDepartmentWeightage));
router.delete("/kpi-definitions/:id/department-weightage/:departmentId", (0, rbac_middleware_1.requirePermission)("kpi.weightage.manage"), (0, asyncHandler_1.asyncHandler)(KpiDefinitionController_1.KpiDefinitionController.removeDepartmentWeightage));
// Scores - self-service first (literal paths), then override-permission
// paths, ranking last. /scores/me and /scores/rankings/* are literal and
// registered before /scores/employees/:employeeId to avoid any risk of the
// route-ordering bug this project has hit twice before.
router.get("/scores/me", (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.getMyScore));
router.get("/scores/me/trend", (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.getMyTrend));
router.get("/scores/rankings/top-performers", (0, rbac_middleware_1.requirePermission)("kpi.ranking.view"), (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.topPerformers));
router.get("/scores/rankings/bottom-performers", (0, rbac_middleware_1.requirePermission)("kpi.ranking.view"), (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.bottomPerformers));
router.get("/scores/rankings/departments", (0, rbac_middleware_1.requirePermission)("kpi.ranking.view"), (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.departmentRanking));
router.post("/scores/manual-entry", (0, rbac_middleware_1.requirePermission)("kpi.score.manual_entry"), (0, validate_request_middleware_1.validate)(kpi_dto_1.recordManualScoreSchema), (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.recordManualScore));
router.get("/scores/employees/:employeeId", (0, rbac_middleware_1.requirePermission)("kpi.score.view"), (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.getEmployeeScore));
router.get("/scores/employees/:employeeId/trend", (0, rbac_middleware_1.requirePermission)("kpi.score.view"), (0, asyncHandler_1.asyncHandler)(ScoreController_1.ScoreController.getEmployeeTrend));
exports.default = router;
//# sourceMappingURL=scoring.routes.js.map