import { Router } from "express";
import { FinishingRecipeController } from "../controllers/FinishingRecipeController";
import { FinishingLibraryController } from "../controllers/FinishingLibraryController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const router = Router();

// Finishing Recipe Routes
router.get("/finishing-recipes", authMiddleware, FinishingRecipeController.getAll);
router.get("/finishing-recipes/:id", authMiddleware, FinishingRecipeController.getById);
router.post("/finishing-recipes", authMiddleware, FinishingRecipeController.create);

// Finishing Library Routes
router.get("/finishing-library", authMiddleware, FinishingLibraryController.getAll);
router.get("/finishing-library/:id", authMiddleware, FinishingLibraryController.getById);
router.post("/finishing-library", authMiddleware, FinishingLibraryController.create);
router.delete("/finishing-library/:id", authMiddleware, FinishingLibraryController.delete);

export default router;
