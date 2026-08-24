import { Router } from "express";
import { ProductionLineController } from "../controllers/ProductionLineController";
import { ShiftController } from "../controllers/ShiftController";
import { ProductionEntryController } from "../controllers/ProductionEntryController";
import { createProductionLineSchema, updateProductionLineSchema } from "../../application/dto/productionLine.dto";
import { createShiftSchema, updateShiftSchema } from "../../application/dto/shift.dto";
import { createProductionEntrySchema, updateProductionEntrySchema } from "../../application/dto/productionEntry.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Production Line Master
router.get("/production-lines", requirePermission("factory.line.view"), asyncHandler(ProductionLineController.list));
router.post("/production-lines", requirePermission("factory.line.create"), validate(createProductionLineSchema), asyncHandler(ProductionLineController.create));
router.patch("/production-lines/:id", requirePermission("factory.line.update"), validate(updateProductionLineSchema), asyncHandler(ProductionLineController.update));
router.delete("/production-lines/:id", requirePermission("factory.line.delete"), asyncHandler(ProductionLineController.remove));

// Shift Master
router.get("/shifts", asyncHandler(ShiftController.list));
router.post("/shifts", requirePermission("factory.shift.create"), validate(createShiftSchema), asyncHandler(ShiftController.create));
router.patch("/shifts/:id", requirePermission("factory.shift.update"), validate(updateShiftSchema), asyncHandler(ShiftController.update));
router.delete("/shifts/:id", requirePermission("factory.shift.delete"), asyncHandler(ShiftController.remove));

// Production Entries - fine-grained authorization (manager-of-employee or HR
// override) is enforced inside ProductionEntryService, same pattern as
// Office Performance goals/reviews. The line/shift summary is operational
// floor-level data (who produced what on a given line/shift/day) rather than
// an individual employee record, so it's viewable by any authenticated user
// rather than gated per-employee.
router.get("/employees/:employeeId/production-entries", asyncHandler(ProductionEntryController.listForEmployee));
router.get("/production-entries/summary", asyncHandler(ProductionEntryController.lineShiftSummary));
router.post("/production-entries", validate(createProductionEntrySchema), asyncHandler(ProductionEntryController.create));
router.patch("/production-entries/:id", validate(updateProductionEntrySchema), asyncHandler(ProductionEntryController.update));
router.delete("/production-entries/:id", asyncHandler(ProductionEntryController.remove));

export default router;
