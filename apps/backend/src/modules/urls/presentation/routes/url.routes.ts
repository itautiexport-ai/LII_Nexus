import { Router } from "express";
import { UrlController, createUrlSchema } from "../controllers/UrlController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.post("/important-urls", validate(createUrlSchema), asyncHandler(UrlController.create));
router.get("/important-urls", asyncHandler(UrlController.list));
router.delete("/important-urls/:id", asyncHandler(UrlController.remove));

export default router;
