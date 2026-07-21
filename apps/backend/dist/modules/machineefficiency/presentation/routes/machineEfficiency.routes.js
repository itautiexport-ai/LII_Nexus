"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MachineEfficiencyController_1 = require("../controllers/MachineEfficiencyController");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
const ctrl = new MachineEfficiencyController_1.MachineEfficiencyController();
// Targets
router.get("/machine-targets", (0, asyncHandler_1.asyncHandler)(ctrl.listTargets.bind(ctrl)));
router.post("/machine-targets", (0, asyncHandler_1.asyncHandler)(ctrl.createTarget.bind(ctrl)));
router.get("/machine-targets/:id", (0, asyncHandler_1.asyncHandler)(ctrl.getTargetById.bind(ctrl)));
router.patch("/machine-targets/:id", (0, asyncHandler_1.asyncHandler)(ctrl.updateTarget.bind(ctrl)));
router.delete("/machine-targets/:id", (0, asyncHandler_1.asyncHandler)(ctrl.deleteTarget.bind(ctrl)));
// Efficiency Entries
router.get("/machine-efficiency", (0, asyncHandler_1.asyncHandler)(ctrl.listEntries.bind(ctrl)));
router.post("/machine-efficiency", (0, asyncHandler_1.asyncHandler)(ctrl.createEntry.bind(ctrl)));
router.get("/machine-efficiency/:id", (0, asyncHandler_1.asyncHandler)(ctrl.getEntryById.bind(ctrl)));
exports.default = router;
//# sourceMappingURL=machineEfficiency.routes.js.map