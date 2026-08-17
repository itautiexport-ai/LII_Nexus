import { Router } from "express";
import { FinishingRecipeController } from "../controllers/FinishingRecipeController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new FinishingRecipeController();

// Use authentication middleware for all routes
router.use(authMiddleware);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.delete("/bulk", controller.deleteBulk);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);

export default router;
