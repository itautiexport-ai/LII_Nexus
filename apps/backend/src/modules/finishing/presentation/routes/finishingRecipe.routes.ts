import { Router } from "express";
import { FinishingRecipeController } from "../controllers/FinishingRecipeController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/finishing-recipes", authMiddleware, FinishingRecipeController.getAll);
router.get("/finishing-recipes/:id", authMiddleware, FinishingRecipeController.getById);
router.post("/finishing-recipes", authMiddleware, FinishingRecipeController.create);

export default router;
