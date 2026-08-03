import { Router } from "express";
import { AuthController, loginSchema } from "../controllers/AuthController";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(AuthController.login));
router.post("/refresh", asyncHandler(AuthController.refresh));
router.get("/me", authMiddleware, asyncHandler(AuthController.me));
router.post("/logout", asyncHandler(AuthController.logout));

export default router;
