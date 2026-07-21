"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductionLineController_1 = require("../controllers/ProductionLineController");
const ShiftController_1 = require("../controllers/ShiftController");
const ProductionEntryController_1 = require("../controllers/ProductionEntryController");
const productionLine_dto_1 = require("../../application/dto/productionLine.dto");
const shift_dto_1 = require("../../application/dto/shift.dto");
const productionEntry_dto_1 = require("../../application/dto/productionEntry.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Production Line Master
router.get("/production-lines", (0, rbac_middleware_1.requirePermission)("factory.line.view"), (0, asyncHandler_1.asyncHandler)(ProductionLineController_1.ProductionLineController.list));
router.post("/production-lines", (0, rbac_middleware_1.requirePermission)("factory.line.create"), (0, validate_request_middleware_1.validate)(productionLine_dto_1.createProductionLineSchema), (0, asyncHandler_1.asyncHandler)(ProductionLineController_1.ProductionLineController.create));
router.patch("/production-lines/:id", (0, rbac_middleware_1.requirePermission)("factory.line.update"), (0, validate_request_middleware_1.validate)(productionLine_dto_1.updateProductionLineSchema), (0, asyncHandler_1.asyncHandler)(ProductionLineController_1.ProductionLineController.update));
router.delete("/production-lines/:id", (0, rbac_middleware_1.requirePermission)("factory.line.delete"), (0, asyncHandler_1.asyncHandler)(ProductionLineController_1.ProductionLineController.remove));
// Shift Master
router.get("/shifts", (0, rbac_middleware_1.requirePermission)("factory.shift.view"), (0, asyncHandler_1.asyncHandler)(ShiftController_1.ShiftController.list));
router.post("/shifts", (0, rbac_middleware_1.requirePermission)("factory.shift.create"), (0, validate_request_middleware_1.validate)(shift_dto_1.createShiftSchema), (0, asyncHandler_1.asyncHandler)(ShiftController_1.ShiftController.create));
router.patch("/shifts/:id", (0, rbac_middleware_1.requirePermission)("factory.shift.update"), (0, validate_request_middleware_1.validate)(shift_dto_1.updateShiftSchema), (0, asyncHandler_1.asyncHandler)(ShiftController_1.ShiftController.update));
router.delete("/shifts/:id", (0, rbac_middleware_1.requirePermission)("factory.shift.delete"), (0, asyncHandler_1.asyncHandler)(ShiftController_1.ShiftController.remove));
// Production Entries - fine-grained authorization (manager-of-employee or HR
// override) is enforced inside ProductionEntryService, same pattern as
// Office Performance goals/reviews. The line/shift summary is operational
// floor-level data (who produced what on a given line/shift/day) rather than
// an individual employee record, so it's viewable by any authenticated user
// rather than gated per-employee.
router.get("/employees/:employeeId/production-entries", (0, asyncHandler_1.asyncHandler)(ProductionEntryController_1.ProductionEntryController.listForEmployee));
router.get("/production-entries/summary", (0, asyncHandler_1.asyncHandler)(ProductionEntryController_1.ProductionEntryController.lineShiftSummary));
router.post("/production-entries", (0, validate_request_middleware_1.validate)(productionEntry_dto_1.createProductionEntrySchema), (0, asyncHandler_1.asyncHandler)(ProductionEntryController_1.ProductionEntryController.create));
router.patch("/production-entries/:id", (0, validate_request_middleware_1.validate)(productionEntry_dto_1.updateProductionEntrySchema), (0, asyncHandler_1.asyncHandler)(ProductionEntryController_1.ProductionEntryController.update));
router.delete("/production-entries/:id", (0, asyncHandler_1.asyncHandler)(ProductionEntryController_1.ProductionEntryController.remove));
exports.default = router;
//# sourceMappingURL=factory.routes.js.map