"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KpiEngineController_1 = require("../controllers/KpiEngineController");
const kpiengine_dto_1 = require("../../application/dto/kpiengine.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Literal paths first, as always in this project.
router.get("/kpi-engine/dashboard", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.dashboard));
router.post("/kpi-engine/validate-formula", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.manage"), (0, validate_request_middleware_1.validate)(kpiengine_dto_1.validateFormulaSchema), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.validateFormula));
router.get("/kpi-engine/scores/me", (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.myScore));
router.get("/kpi-engine/scores/company", (0, rbac_middleware_1.requirePermission)("kpiengine.score.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.companyScore));
router.get("/kpi-engine/scores/departments/:departmentId", (0, rbac_middleware_1.requirePermission)("kpiengine.score.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.departmentScore));
router.get("/kpi-engine/scores/employees/:employeeId", (0, rbac_middleware_1.requirePermission)("kpiengine.score.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.employeeScore));
router.get("/kpi-engine/definitions", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.listDefinitions));
router.post("/kpi-engine/definitions", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.manage"), (0, validate_request_middleware_1.validate)(kpiengine_dto_1.createDefinitionSchema), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.createDefinition));
router.get("/kpi-engine/definitions/:id", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.getDefinition));
router.patch("/kpi-engine/definitions/:id", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.manage"), (0, validate_request_middleware_1.validate)(kpiengine_dto_1.updateDefinitionSchema), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.updateDefinition));
router.delete("/kpi-engine/definitions/:id", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.manage"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.removeDefinition));
router.post("/kpi-engine/definitions/:id/entries", (0, rbac_middleware_1.requirePermission)("kpiengine.entry.manage"), (0, validate_request_middleware_1.validate)(kpiengine_dto_1.recordEntrySchema), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.recordEntry));
router.get("/kpi-engine/definitions/:id/history", (0, rbac_middleware_1.requirePermission)("kpiengine.definition.view"), (0, asyncHandler_1.asyncHandler)(KpiEngineController_1.KpiEngineController.getHistory));
exports.default = router;
//# sourceMappingURL=kpiengine.routes.js.map