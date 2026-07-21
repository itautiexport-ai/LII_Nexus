import { Router } from "express";
import { CommandCenterController } from "../controllers/CommandCenterController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/command-center/overview", requirePermission("commandcenter.view"), asyncHandler(CommandCenterController.getOverview));

export default router;
