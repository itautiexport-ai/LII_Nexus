import { Router } from "express";
import { KpiEngineController } from "../controllers/KpiEngineController";
import { createDefinitionSchema, updateDefinitionSchema, recordEntrySchema, validateFormulaSchema } from "../../application/dto/kpiengine.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Literal paths first, as always in this project.
router.get("/kpi-engine/dashboard", requirePermission("kpiengine.definition.view"), asyncHandler(KpiEngineController.dashboard));
router.post("/kpi-engine/validate-formula", requirePermission("kpiengine.definition.manage"), validate(validateFormulaSchema), asyncHandler(KpiEngineController.validateFormula));
router.get("/kpi-engine/scores/me", asyncHandler(KpiEngineController.myScore));
router.get("/kpi-engine/scores/company", requirePermission("kpiengine.score.view"), asyncHandler(KpiEngineController.companyScore));
router.get("/kpi-engine/scores/departments/:departmentId", requirePermission("kpiengine.score.view"), asyncHandler(KpiEngineController.departmentScore));
router.get("/kpi-engine/scores/employees/:employeeId", requirePermission("kpiengine.score.view"), asyncHandler(KpiEngineController.employeeScore));

router.get("/kpi-engine/definitions", requirePermission("kpiengine.definition.view"), asyncHandler(KpiEngineController.listDefinitions));
router.post("/kpi-engine/definitions", requirePermission("kpiengine.definition.manage"), validate(createDefinitionSchema), asyncHandler(KpiEngineController.createDefinition));
router.get("/kpi-engine/definitions/:id", requirePermission("kpiengine.definition.view"), asyncHandler(KpiEngineController.getDefinition));
router.patch("/kpi-engine/definitions/:id", requirePermission("kpiengine.definition.manage"), validate(updateDefinitionSchema), asyncHandler(KpiEngineController.updateDefinition));
router.delete("/kpi-engine/definitions/:id", requirePermission("kpiengine.definition.manage"), asyncHandler(KpiEngineController.removeDefinition));

router.post("/kpi-engine/definitions/:id/entries", requirePermission("kpiengine.entry.manage"), validate(recordEntrySchema), asyncHandler(KpiEngineController.recordEntry));
router.get("/kpi-engine/definitions/:id/history", requirePermission("kpiengine.definition.view"), asyncHandler(KpiEngineController.getHistory));

export default router;
