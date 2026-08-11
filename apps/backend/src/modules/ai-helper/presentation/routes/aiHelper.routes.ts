import { Router } from "express";
import { AiHelperController } from "../controllers/AiHelperController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.post("/query", asyncHandler(AiHelperController.query));

export default router;
