import { Router } from "express";
import { MachineEfficiencyController } from "../controllers/MachineEfficiencyController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

const ctrl = new MachineEfficiencyController();

// Targets
router.get("/machine-targets", asyncHandler(ctrl.listTargets.bind(ctrl)));
router.post("/machine-targets", asyncHandler(ctrl.createTarget.bind(ctrl)));
router.get("/machine-targets/:id", asyncHandler(ctrl.getTargetById.bind(ctrl)));
router.patch("/machine-targets/:id", asyncHandler(ctrl.updateTarget.bind(ctrl)));
router.delete("/machine-targets/:id", asyncHandler(ctrl.deleteTarget.bind(ctrl)));

// Efficiency Entries
router.get("/machine-efficiency", asyncHandler(ctrl.listEntries.bind(ctrl)));
router.post("/machine-efficiency", asyncHandler(ctrl.createEntry.bind(ctrl)));
router.get("/machine-efficiency/:id", asyncHandler(ctrl.getEntryById.bind(ctrl)));

export default router;
